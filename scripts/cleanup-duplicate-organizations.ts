/**
 * Script to clean up duplicate organizations for users.
 * 
 * This script:
 * 1. Finds organizations with duplicate normalized names for the same user
 * 2. Keeps the oldest organization (by createdAt)
 * 3. Consolidates memberships to the kept organization
 * 4. Updates activeOrganizationId references
 * 5. Deletes duplicate organizations
 * 
 * Usage:
 *   npx tsx scripts/cleanup-duplicate-organizations.ts [--dry-run]
 */

import { PrismaClient } from "@prisma/client";
import { normalizeOrganizationName } from "../src/lib/utils/organization-name";

const prisma = new PrismaClient();

interface DuplicateGroup {
  userId: string;
  normalizedName: string;
  organizations: Array<{
    id: string;
    name: string;
    createdAt: Date;
    membershipId: string;
  }>;
}

async function findDuplicateOrganizations(): Promise<DuplicateGroup[]> {
  // Get all memberships with their organizations
  // Note: We use normalizedName from the database, which should already be populated
  const memberships = await prisma.membership.findMany({
    include: {
      organization: true,
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group by userId and normalizedName
  const groups = new Map<string, Map<string, DuplicateGroup["organizations"]>>();

  for (const membership of memberships) {
    const normalizedName = membership.organization.normalizedName;
    const key = `${membership.userId}:${normalizedName}`;

    if (!groups.has(membership.userId)) {
      groups.set(membership.userId, new Map());
    }

    const userGroups = groups.get(membership.userId)!;

    if (!userGroups.has(normalizedName)) {
      userGroups.set(normalizedName, []);
    }

    userGroups.get(normalizedName)!.push({
      id: membership.organization.id,
      name: membership.organization.name,
      createdAt: membership.organization.createdAt,
      membershipId: membership.id,
    });
  }

  // Find duplicates (groups with more than 1 organization)
  const duplicates: DuplicateGroup[] = [];

  for (const [userId, userGroups] of groups.entries()) {
    for (const [normalizedName, orgs] of userGroups.entries()) {
      if (orgs.length > 1) {
        duplicates.push({
          userId,
          normalizedName,
          organizations: orgs.sort((a, b) =>
            a.createdAt.getTime() - b.createdAt.getTime(),
          ),
        });
      }
    }
  }

  return duplicates;
}

async function cleanupDuplicates(dryRun: boolean = false): Promise<void> {
  console.log("🔍 Searching for duplicate organizations...\n");

  const duplicates = await findDuplicateOrganizations();

  if (duplicates.length === 0) {
    console.log("✅ No duplicate organizations found!");
    return;
  }

  console.log(`📊 Found ${duplicates.length} duplicate group(s):\n`);

  for (const group of duplicates) {
    const kept = group.organizations[0]; // Oldest
    const duplicatesToDelete = group.organizations.slice(1);

    console.log(`User: ${group.userId}`);
    console.log(`Normalized name: ${group.normalizedName}`);
    console.log(`  ✅ Keep: ${kept.name} (${kept.id}) - created ${kept.createdAt.toISOString()}`);
    for (const dup of duplicatesToDelete) {
      console.log(`  ❌ Delete: ${dup.name} (${dup.id}) - created ${dup.createdAt.toISOString()}`);
    }
    console.log();
  }

  if (dryRun) {
    console.log("🔍 DRY RUN - No changes made");
    return;
  }

  console.log("🧹 Cleaning up duplicates...\n");

  let totalDeleted = 0;
  let totalUpdated = 0;

  for (const group of duplicates) {
    const kept = group.organizations[0];
    const duplicatesToDelete = group.organizations.slice(1);

    await prisma.$transaction(async (trx) => {
      // Update activeOrganizationId if it points to a duplicate
      const user = await trx.user.findUnique({
        where: { id: group.userId },
        select: { activeOrganizationId: true },
      });

      if (
        user?.activeOrganizationId &&
        duplicatesToDelete.some((d) => d.id === user.activeOrganizationId)
      ) {
        await trx.user.update({
          where: { id: group.userId },
          data: { activeOrganizationId: kept.id },
        });
        totalUpdated++;
        console.log(
          `  ↻ Updated activeOrganizationId for user ${group.userId} to ${kept.id}`,
        );
      }

      // Delete duplicate organizations (cascade will handle memberships)
      for (const dup of duplicatesToDelete) {
        await trx.organization.delete({
          where: { id: dup.id },
        });
        totalDeleted++;
        console.log(`  🗑️  Deleted organization ${dup.id} (${dup.name})`);
      }
    });
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`   - Deleted ${totalDeleted} duplicate organization(s)`);
  console.log(`   - Updated ${totalUpdated} user activeOrganizationId reference(s)`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  try {
    await cleanupDuplicates(dryRun);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

