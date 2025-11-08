import { MembershipRole, type Membership } from "@prisma/client";

import { prisma } from "@/lib/db";

type EnsureOrganizationOptions = {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
};

const DEFAULT_ORG_NAME = "Organización Demo COBRA";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .replace(/-{2,}/g, "-");

async function generateUniqueSlug(
  name: string,
): Promise<string> {
  const baseSlug = slugify(name) || "organization";
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const existing = await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function ensurePrimaryMembership(
  options: EnsureOrganizationOptions,
): Promise<Membership & { organization: { id: string; name: string; slug: string | null } }> {
  const { userId, userName, userEmail } = options;

  const existingMembership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingMembership) {
    return existingMembership;
  }

  const organizationName =
    userName ??
    (userEmail ? `${userEmail.split("@")[0]} • Organización` : DEFAULT_ORG_NAME);

  return prisma.$transaction(async (trx) => {
    const organization = await trx.organization.create({
      data: {
        name: organizationName,
        slug: await generateUniqueSlug(organizationName),
      },
    });

    const membership = await trx.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        role: MembershipRole.OWNER,
      },
      include: {
        organization: true,
      },
    });

    return membership;
  });
}

