import "server-only";

import * as Sentry from "@sentry/nextjs";
import { MembershipRole, type Membership, type Organization } from "@prisma/client";

import { prisma } from "@/lib/db";
import { normalizeOrganizationName } from "@/lib/utils/organization-name";

type EnsureOrganizationOptions = {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
};

type CreateOrganizationOptions = {
  userId: string;
  name: string;
  countryCode?: string | null;
  defaultCurrency?: string | null;
  idempotencyKey?: string | null;
};

export type CreateOrganizationResult =
  | {
      success: true;
      organization: Organization & { membership: Membership };
      isDuplicate: false;
    }
  | {
      success: true;
      organization: Organization & { membership: Membership };
      isDuplicate: true;
      message: string;
    }
  | {
      success: false;
      error: string;
      code: "DUPLICATE_NAME" | "VALIDATION_ERROR" | "SERVER_ERROR";
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
  trx?: any,
): Promise<string> {
  const db = trx || prisma;
  const baseSlug = slugify(name) || "organization";
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const existing = await db.organization.findUnique({
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
    const normalizedName = normalizeOrganizationName(organizationName);
    const organization = await trx.organization.create({
      data: {
        name: organizationName,
        normalizedName,
        slug: await generateUniqueSlug(organizationName, trx),
        defaultCurrency: "USD",
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

    // Establecer como organización activa si es la primera
    await trx.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organization.id },
    });

    return membership;
  });
}

export async function createOrganizationWithOwner(
  options: CreateOrganizationOptions,
): Promise<CreateOrganizationResult> {
  const { userId, name, countryCode, defaultCurrency, idempotencyKey } = options;

  return Sentry.startSpan(
    {
      op: "db.transaction",
      name: "CreateOrganizationWithOwner",
    },
    async () => {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        Sentry.captureException(new Error("Invalid organization name"), {
          tags: { userId, nameLength: trimmedName.length },
        });
        return {
          success: false,
          error: "El nombre de la organización debe tener al menos 2 caracteres",
          code: "VALIDATION_ERROR",
        };
      }

      const normalizedName = normalizeOrganizationName(trimmedName);

      try {
        return await prisma.$transaction(
          async (trx) => {
            // Check idempotency first if key provided
            if (idempotencyKey) {
              const existingIdempotency = await trx.organizationCreationIdempotency.findUnique({
                where: { idempotencyKey },
                include: { organization: true },
              });

              if (existingIdempotency) {
                // Check if user has membership
                const membership = await trx.membership.findUnique({
                  where: {
                    userId_organizationId: {
                      userId,
                      organizationId: existingIdempotency.organizationId,
                    },
                  },
                });

                if (membership) {
                  Sentry.logger.info("Organization creation idempotent hit", {
                    userId,
                    organizationId: existingIdempotency.organizationId,
                    idempotencyKey,
                  });

                  // Ensure it's set as active
                  await trx.user.update({
                    where: { id: userId },
                    data: { activeOrganizationId: existingIdempotency.organizationId },
                  });

                  return {
                    success: true,
                    organization: {
                      ...existingIdempotency.organization,
                      membership,
                    },
                    isDuplicate: false,
                  };
                }
              }
            }

            // Check for duplicate normalized name within user's organizations
            const userMemberships = await trx.membership.findMany({
              where: { userId },
              include: { organization: true },
            });

            const duplicateOrg = userMemberships.find(
              (m) => m.organization.normalizedName === normalizedName,
            );

            if (duplicateOrg) {
              Sentry.logger.warn("Duplicate organization name detected", {
                userId,
                normalizedName,
                existingOrgId: duplicateOrg.organizationId,
              });

              // Set as active and return existing organization
              await trx.user.update({
                where: { id: userId },
                data: { activeOrganizationId: duplicateOrg.organizationId },
              });

              return {
                success: true,
                organization: {
                  ...duplicateOrg.organization,
                  membership: duplicateOrg,
                },
                isDuplicate: true,
                message: "Esta empresa ya existe en tu cuenta",
              };
            }

            // Create new organization
            const organization = await trx.organization.create({
              data: {
                name: trimmedName,
                normalizedName,
                slug: await generateUniqueSlug(trimmedName, trx),
                countryCode: countryCode || null,
                defaultCurrency: defaultCurrency || "USD",
              },
            });

            const membership = await trx.membership.create({
              data: {
                userId,
                organizationId: organization.id,
                role: MembershipRole.OWNER,
              },
            });

            // Create idempotency record if key provided
            if (idempotencyKey) {
              await trx.organizationCreationIdempotency.create({
                data: {
                  userId,
                  idempotencyKey,
                  organizationId: organization.id,
                },
              });
            }

            // Establecer como organización activa
            await trx.user.update({
              where: { id: userId },
              data: { activeOrganizationId: organization.id },
            });

            Sentry.logger.info("Organization created successfully", {
              userId,
              organizationId: organization.id,
              normalizedName,
            });

            return {
              success: true,
              organization: { ...organization, membership },
              isDuplicate: false,
            };
          },
          {
            timeout: 10000, // 10 seconds timeout
          },
        );
      } catch (error) {
        Sentry.captureException(error, {
          tags: { userId, normalizedName },
          extra: { name: trimmedName },
        });

        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Error al crear la organización. Por favor intenta nuevamente.",
          code: "SERVER_ERROR",
        };
      }
    },
  );
}

export async function getUserOrganizations(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    slug: string | null;
    countryCode: string | null;
    defaultCurrency: string | null;
    role: MembershipRole;
    isActive: boolean;
  }>
> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeOrganizationId: true },
  });

  return memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    countryCode: m.organization.countryCode,
    defaultCurrency: m.organization.defaultCurrency,
    role: m.role,
    isActive: m.organization.id === user?.activeOrganizationId,
  }));
}

export async function getActiveOrganization(
  userId: string,
): Promise<Organization | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      activeOrganization: true,
    },
  });

  if (!user?.activeOrganization) {
    return null;
  }

  // Verificar que el usuario tenga membresía en esta organización
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: user.activeOrganization.id,
      },
    },
  });

  if (!membership) {
    // Si no tiene membresía, limpiar la referencia
    await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: null },
    });
    return null;
  }

  return user.activeOrganization;
}

export async function setActiveOrganization(
  userId: string,
  organizationId: string,
): Promise<void> {
  // Verificar que el usuario tenga membresía en esta organización
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("User does not have membership in this organization");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { activeOrganizationId: organizationId },
  });
}

