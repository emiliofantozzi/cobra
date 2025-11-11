import {
  createContact,
  type Contact,
  type ContactDraft,
  type ContactId,
  type ContactCreateData,
  type CustomerCompanyId,
} from "../domain";
import {
  type ContactRepository,
  type RepositoryContext,
  type PaginatedResult,
  type ListContactsParams,
} from "../repositories";
import { validateEmail, validateE164 } from "../utils/validation/channel-validators";

export interface ContactsServiceDependencies {
  contactRepository: ContactRepository;
}

export function createContactsService(deps: ContactsServiceDependencies) {
  const { contactRepository } = deps;

  return {
    async listContacts(
      context: RepositoryContext,
      params?: ListContactsParams,
    ): Promise<PaginatedResult<Contact>> {
      return contactRepository.list(context, params);
    },

    async getContact(context: RepositoryContext, contactId: ContactId): Promise<Contact | null> {
      return contactRepository.findById(context, contactId);
    },

    async searchContacts(
      context: RepositoryContext,
      search: string,
      limit?: number,
    ): Promise<Contact[]> {
      return contactRepository.searchByName(context, search, limit);
    },

    async validateContactUniqueness(
      context: RepositoryContext,
      customerCompanyId: CustomerCompanyId,
      email?: string,
      whatsappNumber?: string,
      excludeContactId?: ContactId,
    ): Promise<{ isUnique: boolean; duplicateField?: "email" | "whatsapp"; existingContactId?: ContactId }> {
      if (email) {
        const existing = await contactRepository.findByEmail(context, customerCompanyId, email);
        if (existing && existing.id !== excludeContactId) {
          return { isUnique: false, duplicateField: "email", existingContactId: existing.id };
        }
      }

      if (whatsappNumber) {
        const existing = await contactRepository.findByWhatsApp(context, customerCompanyId, whatsappNumber);
        if (existing && existing.id !== excludeContactId) {
          return { isUnique: false, duplicateField: "whatsapp", existingContactId: existing.id };
        }
      }

      return { isUnique: true };
    },

    async createContact(context: RepositoryContext, draft: ContactDraft): Promise<Contact> {
      // Validate at least one channel
      if (!draft.email && !draft.phoneNumber && !draft.whatsappNumber) {
        throw new Error("Debe proporcionar al menos un canal de contacto (email, teléfono o WhatsApp)");
      }

      // Validate email format if present
      if (draft.email && !validateEmail(draft.email)) {
        throw new Error("Email inválido (ej: usuario@dominio.com)");
      }

      // Validate phone/WhatsApp format if present
      if (draft.phoneNumber && !validateE164(draft.phoneNumber)) {
        throw new Error("Teléfono inválido. Usar formato internacional: +56912345678");
      }

      if (draft.whatsappNumber && !validateE164(draft.whatsappNumber)) {
        throw new Error("WhatsApp inválido. Usar formato internacional: +56912345678");
      }

      // Check uniqueness
      const uniqueness = await this.validateContactUniqueness(
        context,
        draft.customerCompanyId,
        draft.email,
        draft.whatsappNumber,
      );

      if (!uniqueness.isUnique) {
        const fieldName = uniqueness.duplicateField === "email" ? "email" : "WhatsApp";
        throw new Error(`Ya existe un contacto con este ${fieldName} en esta empresa`);
      }

      // Handle primary contact: if setting as primary, unset others
      if (draft.isPrimary) {
        const existingPrimary = await contactRepository.findPrimaryByCompany(
          context,
          draft.customerCompanyId,
        );
        if (existingPrimary) {
          await contactRepository.update(context, existingPrimary.id, { isPrimary: false });
        }
      }

      // Handle billing contact: if setting as billing, unset others
      if (draft.isBillingContact) {
        const existingBilling = await contactRepository.findBillingByCompany(
          context,
          draft.customerCompanyId,
        );
        if (existingBilling) {
          await contactRepository.update(context, existingBilling.id, { isBillingContact: false });
        }
      }

      // Set default preferred channel if not specified
      if (!draft.preferredChannel) {
        if (draft.email) {
          draft.preferredChannel = "EMAIL";
        } else if (draft.whatsappNumber) {
          draft.preferredChannel = "WHATSAPP";
        } else if (draft.phoneNumber) {
          draft.preferredChannel = "PHONE";
        }
      }

      const sanitized = createContact(draft);
      return contactRepository.create(context, sanitized);
    },

    async updateContact(
      context: RepositoryContext,
      contactId: ContactId,
      patch: Partial<Omit<ContactDraft, "organizationId" | "customerCompanyId">>,
    ): Promise<Contact> {
      const existing = await contactRepository.findById(context, contactId);
      if (!existing) {
        throw new Error("Contacto no encontrado");
      }

      // Validate email format if being updated
      if (patch.email !== undefined && patch.email && !validateEmail(patch.email)) {
        throw new Error("Email inválido (ej: usuario@dominio.com)");
      }

      // Validate phone/WhatsApp format if being updated
      if (patch.phoneNumber !== undefined && patch.phoneNumber && !validateE164(patch.phoneNumber)) {
        throw new Error("Teléfono inválido. Usar formato internacional: +56912345678");
      }

      if (patch.whatsappNumber !== undefined && patch.whatsappNumber && !validateE164(patch.whatsappNumber)) {
        throw new Error("WhatsApp inválido. Usar formato internacional: +56912345678");
      }

      // Check uniqueness if email or WhatsApp is being updated
      if (patch.email !== undefined || patch.whatsappNumber !== undefined) {
        const email = patch.email ?? existing.email;
        const whatsapp = patch.whatsappNumber ?? existing.whatsappNumber;

        const uniqueness = await this.validateContactUniqueness(
          context,
          existing.customerCompanyId,
          email,
          whatsapp,
          contactId,
        );

        if (!uniqueness.isUnique) {
          const fieldName = uniqueness.duplicateField === "email" ? "email" : "WhatsApp";
          throw new Error(`Ya existe un contacto con este ${fieldName} en esta empresa`);
        }
      }

      // Handle primary contact: if setting as primary, unset others
      if (patch.isPrimary === true) {
        const existingPrimary = await contactRepository.findPrimaryByCompany(
          context,
          existing.customerCompanyId,
        );
        if (existingPrimary && existingPrimary.id !== contactId) {
          await contactRepository.update(context, existingPrimary.id, { isPrimary: false });
        }
      }

      // Handle billing contact: if setting as billing, unset others
      if (patch.isBillingContact === true) {
        const existingBilling = await contactRepository.findBillingByCompany(
          context,
          existing.customerCompanyId,
        );
        if (existingBilling && existingBilling.id !== contactId) {
          await contactRepository.update(context, existingBilling.id, { isBillingContact: false });
        }
      }

      return contactRepository.update(context, contactId, patch);
    },

    async deleteContact(context: RepositoryContext, contactId: ContactId): Promise<void> {
      await contactRepository.delete(context, contactId);
    },

    async setContactOptOut(
      context: RepositoryContext,
      contactId: ContactId,
      channel: "email" | "whatsapp",
      optedOut: boolean,
    ): Promise<Contact> {
      const patch: Partial<ContactDraft> = {};
      if (channel === "email") {
        patch.optedOutEmail = optedOut;
        patch.optedOutEmailAt = optedOut ? new Date() : undefined;
      } else {
        patch.optedOutWhatsapp = optedOut;
        patch.optedOutWhatsappAt = optedOut ? new Date() : undefined;
      }

      return contactRepository.update(context, contactId, patch);
    },

    async setPrimaryContact(
      context: RepositoryContext,
      contactId: ContactId,
    ): Promise<Contact> {
      const contact = await contactRepository.findById(context, contactId);
      if (!contact) {
        throw new Error("Contacto no encontrado");
      }

      // Unset existing primary
      const existingPrimary = await contactRepository.findPrimaryByCompany(
        context,
        contact.customerCompanyId,
      );
      if (existingPrimary && existingPrimary.id !== contactId) {
        await contactRepository.update(context, existingPrimary.id, { isPrimary: false });
      }

      // Set new primary
      return contactRepository.update(context, contactId, { isPrimary: true });
    },

    async setBillingContact(
      context: RepositoryContext,
      contactId: ContactId,
    ): Promise<Contact> {
      const contact = await contactRepository.findById(context, contactId);
      if (!contact) {
        throw new Error("Contacto no encontrado");
      }

      // Unset existing billing
      const existingBilling = await contactRepository.findBillingByCompany(
        context,
        contact.customerCompanyId,
      );
      if (existingBilling && existingBilling.id !== contactId) {
        await contactRepository.update(context, existingBilling.id, { isBillingContact: false });
      }

      // Set new billing
      return contactRepository.update(context, contactId, { isBillingContact: true });
    },

    async validateChannelFormat(channel: "email" | "phone" | "whatsapp", value: string): Promise<boolean> {
      if (channel === "email") {
        return validateEmail(value);
      }
      return validateE164(value);
    },

    async exportContactsCSV(
      context: RepositoryContext,
      filters?: Partial<ListContactsParams>,
    ): Promise<string> {
      const result = await contactRepository.list(context, { ...filters, pagination: { limit: 10000 } });

      // CSV headers
      const headers = [
        "Nombre",
        "Apellido",
        "Empresa",
        "Email",
        "Teléfono",
        "WhatsApp",
        "Rol",
        "Canal Preferido",
        "Idioma",
        "Zona Horaria",
        "Contacto Primario",
        "Contacto Facturación",
        "Opt-out Email",
        "Opt-out WhatsApp",
        "Creado",
      ];

      // CSV rows
      const rows = result.data.map((contact) => {
        return [
          contact.firstName ?? "",
          contact.lastName ?? "",
          "", // Company name would need join - TODO
          contact.email ?? "",
          contact.phoneNumber ?? "",
          contact.whatsappNumber ?? "",
          contact.role ?? "",
          contact.preferredChannel ?? "",
          contact.language ?? "",
          contact.timezone ?? "",
          contact.isPrimary ? "Sí" : "No",
          contact.isBillingContact ? "Sí" : "No",
          contact.optedOutEmail ? "Sí" : "No",
          contact.optedOutWhatsapp ? "Sí" : "No",
          contact.createdAt.toISOString(),
        ];
      });

      // Combine headers and rows
      const csvLines = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))];

      return csvLines.join("\n");
    },
  };
}

