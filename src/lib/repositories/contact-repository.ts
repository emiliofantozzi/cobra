import type { Contact, ContactDraft, ContactId, ContactCreateData, CustomerCompanyId } from "../domain";
import { prisma } from "../db";
import type { PaginationParams, PaginatedResult, RepositoryContext } from "./types";

export interface ListContactsParams {
  customerCompanyId?: CustomerCompanyId;
  search?: string;
  hasOptedOut?: boolean;
  optedOutEmail?: boolean;
  optedOutWhatsapp?: boolean;
  role?: string;
  preferredChannel?: string;
  hasWhatsapp?: boolean;
  hasEmail?: boolean;
  isPrimary?: boolean;
  isBillingContact?: boolean;
  pagination?: PaginationParams;
  orderBy?: "name" | "company" | "createdAt" | "lastInteraction";
  orderDirection?: "asc" | "desc";
}

export interface ContactRepository {
  findById(context: RepositoryContext, id: ContactId): Promise<Contact | null>;
  list(context: RepositoryContext, params?: ListContactsParams): Promise<PaginatedResult<Contact>>;
  create(context: RepositoryContext, data: ContactCreateData): Promise<Contact>;
  update(
    context: RepositoryContext,
    id: ContactId,
    patch: Partial<Omit<ContactDraft, "organizationId" | "customerCompanyId">>,
  ): Promise<Contact>;
  delete(context: RepositoryContext, id: ContactId): Promise<void>;
  findActiveContacts(context: RepositoryContext, customerCompanyId?: CustomerCompanyId): Promise<Contact[]>;
  updateOptOutStatus(context: RepositoryContext, id: ContactId, hasOptedOut: boolean): Promise<Contact>;
  findByEmail(context: RepositoryContext, customerCompanyId: CustomerCompanyId, email: string): Promise<Contact | null>;
  findByWhatsApp(context: RepositoryContext, customerCompanyId: CustomerCompanyId, whatsappNumber: string): Promise<Contact | null>;
  findPrimaryByCompany(context: RepositoryContext, customerCompanyId: CustomerCompanyId): Promise<Contact | null>;
  findBillingByCompany(context: RepositoryContext, customerCompanyId: CustomerCompanyId): Promise<Contact | null>;
  searchByName(context: RepositoryContext, search: string, limit?: number): Promise<Contact[]>;
  countByFilters(context: RepositoryContext, filters: Partial<ListContactsParams>): Promise<number>;
}

function mapPrismaToDomain(prismaModel: {
  id: string;
  organizationId: string;
  customerCompanyId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  position: string | null;
  notes: string | null;
  isPrimary: boolean;
  role: string | null;
  preferredChannel: string | null;
  emailStatus: string;
  whatsappStatus: string;
  isBillingContact: boolean;
  optedOutEmail: boolean;
  optedOutEmailAt: Date | null;
  optedOutWhatsapp: boolean;
  optedOutWhatsappAt: Date | null;
  language: string | null;
  timezone: string | null;
  workingHoursWindow: unknown;
  hasOptedOut: boolean;
  consentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Contact {
  return {
    id: prismaModel.id as ContactId,
    organizationId: prismaModel.organizationId,
    customerCompanyId: prismaModel.customerCompanyId,
    firstName: prismaModel.firstName ?? undefined,
    lastName: prismaModel.lastName ?? undefined,
    email: prismaModel.email ?? undefined,
    phoneNumber: prismaModel.phoneNumber ?? undefined,
    whatsappNumber: prismaModel.whatsappNumber ?? undefined,
    position: prismaModel.position ?? undefined,
    notes: prismaModel.notes ?? undefined,
    isPrimary: prismaModel.isPrimary,
    role: (prismaModel.role as Contact["role"]) ?? undefined,
    preferredChannel: (prismaModel.preferredChannel as Contact["preferredChannel"]) ?? undefined,
    emailStatus: (prismaModel.emailStatus as Contact["emailStatus"]) ?? "UNKNOWN",
    whatsappStatus: (prismaModel.whatsappStatus as Contact["whatsappStatus"]) ?? "NOT_VALIDATED",
    isBillingContact: prismaModel.isBillingContact,
    optedOutEmail: prismaModel.optedOutEmail,
    optedOutEmailAt: prismaModel.optedOutEmailAt ?? undefined,
    optedOutWhatsapp: prismaModel.optedOutWhatsapp,
    optedOutWhatsappAt: prismaModel.optedOutWhatsappAt ?? undefined,
    language: prismaModel.language ?? undefined,
    timezone: prismaModel.timezone ?? undefined,
    workingHoursWindow: prismaModel.workingHoursWindow as Contact["workingHoursWindow"] | undefined,
    hasOptedOut: prismaModel.hasOptedOut,
    consentDate: prismaModel.consentDate ?? undefined,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
  };
}

export function createContactRepository(): ContactRepository {
  return {
    async findById(context, id) {
      const result = await prisma.contact.findFirst({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async list(context, params) {
      const limit = params?.pagination?.limit ?? 50;
      const cursor = params?.pagination?.cursor;

      const where: any = {
        organizationId: context.organizationId,
      };

      if (params?.customerCompanyId) {
        where.customerCompanyId = params.customerCompanyId;
      }

      if (params?.hasOptedOut !== undefined) {
        where.hasOptedOut = params.hasOptedOut;
      }

      if (params?.optedOutEmail !== undefined) {
        where.optedOutEmail = params.optedOutEmail;
      }

      if (params?.optedOutWhatsapp !== undefined) {
        where.optedOutWhatsapp = params.optedOutWhatsapp;
      }

      if (params?.role) {
        where.role = params.role;
      }

      if (params?.preferredChannel) {
        where.preferredChannel = params.preferredChannel;
      }

      if (params?.hasWhatsapp !== undefined) {
        if (params.hasWhatsapp) {
          where.whatsappNumber = { not: null };
        } else {
          where.whatsappNumber = null;
        }
      }

      if (params?.hasEmail !== undefined) {
        if (params.hasEmail) {
          where.email = { not: null };
        } else {
          where.email = null;
        }
      }

      if (params?.isPrimary !== undefined) {
        where.isPrimary = params.isPrimary;
      }

      if (params?.isBillingContact !== undefined) {
        where.isBillingContact = params.isBillingContact;
      }

      if (params?.search && params.search.trim().length > 0) {
        const searchTerm = params.search.trim();
        where.OR = [
          { firstName: { contains: searchTerm, mode: "insensitive" } },
          { lastName: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { phoneNumber: { contains: searchTerm, mode: "insensitive" } },
          { whatsappNumber: { contains: searchTerm, mode: "insensitive" } },
          {
            customerCompany: {
              name: { contains: searchTerm, mode: "insensitive" },
            },
          },
        ];
      }

      // Order by
      let orderBy: any = { createdAt: "desc" };
      if (params?.orderBy) {
        switch (params.orderBy) {
          case "name":
            orderBy = { firstName: params.orderDirection ?? "asc" };
            break;
          case "company":
            orderBy = { customerCompany: { name: params.orderDirection ?? "asc" } };
            break;
          case "createdAt":
            orderBy = { createdAt: params.orderDirection ?? "desc" };
            break;
          case "lastInteraction":
            // TODO: Join with communication_attempts when available
            orderBy = { updatedAt: params.orderDirection ?? "desc" };
            break;
        }
      }

      const [data, totalCount] = await Promise.all([
        prisma.contact.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy,
          include: {
            customerCompany: {
              select: {
                name: true,
              },
            },
          },
        }),
        prisma.contact.count({ where }),
      ]);

      const hasNextPage = data.length > limit;
      const items = hasNextPage ? data.slice(0, limit) : data;
      const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1]!.id : null;

      return {
        data: items.map(mapPrismaToDomain),
        nextCursor,
        totalCount,
      };
    },

    async create(context, data) {
      const result = await prisma.contact.create({
        data: {
          organizationId: context.organizationId,
          customerCompanyId: data.customerCompanyId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          whatsappNumber: data.whatsappNumber,
          position: data.position,
          notes: data.notes,
          isPrimary: data.isPrimary,
          role: data.role,
          preferredChannel: data.preferredChannel,
          emailStatus: data.emailStatus,
          whatsappStatus: data.whatsappStatus,
          isBillingContact: data.isBillingContact,
          optedOutEmail: data.optedOutEmail,
          optedOutEmailAt: data.optedOutEmailAt,
          optedOutWhatsapp: data.optedOutWhatsapp,
          optedOutWhatsappAt: data.optedOutWhatsappAt,
          language: data.language,
          timezone: data.timezone,
          workingHoursWindow: data.workingHoursWindow as any,
          hasOptedOut: data.hasOptedOut,
        },
      });
      return mapPrismaToDomain(result);
    },

    async update(context, id, patch) {
      const updateData: any = {};
      if (patch.firstName !== undefined) updateData.firstName = patch.firstName;
      if (patch.lastName !== undefined) updateData.lastName = patch.lastName;
      if (patch.email !== undefined) updateData.email = patch.email;
      if (patch.phoneNumber !== undefined) updateData.phoneNumber = patch.phoneNumber;
      if (patch.whatsappNumber !== undefined) updateData.whatsappNumber = patch.whatsappNumber;
      if (patch.position !== undefined) updateData.position = patch.position;
      if (patch.notes !== undefined) updateData.notes = patch.notes;
      if (patch.isPrimary !== undefined) updateData.isPrimary = patch.isPrimary;
      if (patch.role !== undefined) updateData.role = patch.role;
      if (patch.preferredChannel !== undefined) updateData.preferredChannel = patch.preferredChannel;
      if (patch.emailStatus !== undefined) updateData.emailStatus = patch.emailStatus;
      if (patch.whatsappStatus !== undefined) updateData.whatsappStatus = patch.whatsappStatus;
      if (patch.isBillingContact !== undefined) updateData.isBillingContact = patch.isBillingContact;
      if (patch.optedOutEmail !== undefined) {
        updateData.optedOutEmail = patch.optedOutEmail;
        updateData.optedOutEmailAt = patch.optedOutEmail ? (patch.optedOutEmailAt ?? new Date()) : null;
      }
      if (patch.optedOutWhatsapp !== undefined) {
        updateData.optedOutWhatsapp = patch.optedOutWhatsapp;
        updateData.optedOutWhatsappAt = patch.optedOutWhatsapp ? (patch.optedOutWhatsappAt ?? new Date()) : null;
      }
      if (patch.language !== undefined) updateData.language = patch.language;
      if (patch.timezone !== undefined) updateData.timezone = patch.timezone;
      if (patch.workingHoursWindow !== undefined) updateData.workingHoursWindow = patch.workingHoursWindow as any;

      const result = await prisma.contact.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: updateData,
      });
      return mapPrismaToDomain(result);
    },

    async delete(context, id) {
      await prisma.contact.delete({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
    },

    async findActiveContacts(context, customerCompanyId) {
      const where: any = {
        organizationId: context.organizationId,
        hasOptedOut: false,
      };

      if (customerCompanyId) {
        where.customerCompanyId = customerCompanyId;
      }

      const results = await prisma.contact.findMany({
        where,
        orderBy: { isPrimary: 'desc' },
      });

      return results.map(mapPrismaToDomain);
    },

    async updateOptOutStatus(context, id, hasOptedOut) {
      const result = await prisma.contact.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: {
          hasOptedOut,
          consentDate: hasOptedOut ? null : new Date(),
        },
      });
      return mapPrismaToDomain(result);
    },

    async findByEmail(context, customerCompanyId, email) {
      const result = await prisma.contact.findFirst({
        where: {
          organizationId: context.organizationId,
          customerCompanyId,
          email: email.toLowerCase().trim(),
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async findByWhatsApp(context, customerCompanyId, whatsappNumber) {
      const result = await prisma.contact.findFirst({
        where: {
          organizationId: context.organizationId,
          customerCompanyId,
          whatsappNumber: whatsappNumber.trim(),
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async findPrimaryByCompany(context, customerCompanyId) {
      const result = await prisma.contact.findFirst({
        where: {
          organizationId: context.organizationId,
          customerCompanyId,
          isPrimary: true,
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async findBillingByCompany(context, customerCompanyId) {
      const result = await prisma.contact.findFirst({
        where: {
          organizationId: context.organizationId,
          customerCompanyId,
          isBillingContact: true,
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async searchByName(context, search, limit = 100) {
      const results = await prisma.contact.findMany({
        where: {
          organizationId: context.organizationId,
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      return results.map(mapPrismaToDomain);
    },

    async countByFilters(context, filters) {
      const where: any = {
        organizationId: context.organizationId,
      };

      if (filters.customerCompanyId) {
        where.customerCompanyId = filters.customerCompanyId;
      }

      if (filters.optedOutEmail !== undefined) {
        where.optedOutEmail = filters.optedOutEmail;
      }

      if (filters.optedOutWhatsapp !== undefined) {
        where.optedOutWhatsapp = filters.optedOutWhatsapp;
      }

      if (filters.role) {
        where.role = filters.role;
      }

      if (filters.preferredChannel) {
        where.preferredChannel = filters.preferredChannel;
      }

      if (filters.hasWhatsapp !== undefined) {
        if (filters.hasWhatsapp) {
          where.whatsappNumber = { not: null };
        } else {
          where.whatsappNumber = null;
        }
      }

      if (filters.hasEmail !== undefined) {
        if (filters.hasEmail) {
          where.email = { not: null };
        } else {
          where.email = null;
        }
      }

      if (filters.isPrimary !== undefined) {
        where.isPrimary = filters.isPrimary;
      }

      if (filters.isBillingContact !== undefined) {
        where.isBillingContact = filters.isBillingContact;
      }

      return prisma.contact.count({ where });
    },
  };
}

