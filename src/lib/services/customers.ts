import {
  createCustomerCompany,
  createContact,
  type CustomerCompany,
  type CustomerCompanyDraft,
  type Contact,
  type ContactDraft,
  type CustomerCompanyId,
  type ContactId,
} from "../domain";
import {
  type CustomerCompanyRepository,
  type ContactRepository,
  type RepositoryContext,
  type PaginatedResult,
  type ListCustomerCompaniesParams,
  type ListContactsParams,
} from "../repositories";

export interface CustomersServiceDependencies {
  customerCompanyRepository: CustomerCompanyRepository;
  contactRepository: ContactRepository;
}

export function createCustomersService(deps: CustomersServiceDependencies) {
  const { customerCompanyRepository, contactRepository } = deps;

  return {
    async listCustomerCompanies(
      context: RepositoryContext,
      params?: ListCustomerCompaniesParams,
    ): Promise<PaginatedResult<CustomerCompany & { contactsCount: number; invoicesCount: number }>> {
      return customerCompanyRepository.list(context, params);
    },

    async getCustomerCompany(context: RepositoryContext, customerCompanyId: CustomerCompanyId): Promise<CustomerCompany | null> {
      return customerCompanyRepository.findById(context, customerCompanyId);
    },

    async getCustomerCompanyWithRelations(
      context: RepositoryContext,
      customerCompanyId: CustomerCompanyId,
    ): Promise<(CustomerCompany & { contactsCount: number; invoicesCount: number; totalPendingAmount: number }) | null> {
      return customerCompanyRepository.findWithRelations(context, customerCompanyId);
    },

    async searchCustomerCompanies(
      context: RepositoryContext,
      search: string,
      limit?: number,
    ): Promise<CustomerCompany[]> {
      return customerCompanyRepository.searchByName(context, search, limit);
    },

    async getCustomerCompanyByTaxId(
      context: RepositoryContext,
      taxId: string,
    ): Promise<CustomerCompany | null> {
      return customerCompanyRepository.findByTaxId(context, taxId);
    },

    async createCustomerCompany(
      context: RepositoryContext,
      draft: CustomerCompanyDraft,
    ): Promise<CustomerCompany> {
      // Check for duplicate taxId if provided
      if (draft.taxId) {
        const existing = await customerCompanyRepository.findByTaxId(context, draft.taxId.trim());
        if (existing) {
          throw new Error("Ya existe una empresa con este RUT/Tax ID en tu organización");
        }
      }

      const sanitized = createCustomerCompany(draft);
      return customerCompanyRepository.create(context, sanitized);
    },

    async updateCustomerCompany(
      context: RepositoryContext,
      customerCompanyId: CustomerCompanyId,
      patch: Partial<Omit<CustomerCompanyDraft, "organizationId">>,
    ): Promise<CustomerCompany> {
      if (patch.name) {
        const trimmedName = patch.name.trim();
        if (!trimmedName) {
          throw new Error("Customer company name cannot be empty");
        }
        patch = { ...patch, name: trimmedName };
      }

      // Check for duplicate taxId if being updated
      if (patch.taxId !== undefined) {
        const trimmedTaxId = patch.taxId?.trim();
        if (trimmedTaxId) {
          const existing = await customerCompanyRepository.findByTaxId(context, trimmedTaxId);
          if (existing && existing.id !== customerCompanyId) {
            throw new Error("Ya existe una empresa con este RUT/Tax ID en tu organización");
          }
        }
      }

      return customerCompanyRepository.update(context, customerCompanyId, patch);
    },

    async archiveCustomerCompany(
      context: RepositoryContext,
      customerCompanyId: CustomerCompanyId,
    ): Promise<CustomerCompany> {
      return customerCompanyRepository.archive(context, customerCompanyId);
    },

    async reactivateCustomerCompany(
      context: RepositoryContext,
      customerCompanyId: CustomerCompanyId,
    ): Promise<CustomerCompany> {
      return customerCompanyRepository.reactivate(context, customerCompanyId);
    },

    async bulkArchiveCustomerCompanies(
      context: RepositoryContext,
      customerCompanyIds: CustomerCompanyId[],
    ): Promise<number> {
      return customerCompanyRepository.bulkArchive(context, customerCompanyIds);
    },

    async listContacts(
      context: RepositoryContext,
      params?: ListContactsParams,
    ): Promise<PaginatedResult<Contact>> {
      return contactRepository.list(context, params);
    },

    async getContact(context: RepositoryContext, contactId: ContactId): Promise<Contact | null> {
      return contactRepository.findById(context, contactId);
    },

    async createContact(
      context: RepositoryContext,
      draft: ContactDraft,
    ): Promise<Contact> {
      const sanitized = createContact(draft);
      return contactRepository.create(context, sanitized);
    },

    async updateContact(
      context: RepositoryContext,
      contactId: ContactId,
      patch: Partial<Omit<ContactDraft, "organizationId" | "customerCompanyId">>,
    ): Promise<Contact> {
      return contactRepository.update(context, contactId, patch);
    },

    async deleteContact(context: RepositoryContext, contactId: ContactId): Promise<void> {
      await contactRepository.delete(context, contactId);
    },
  };
}

