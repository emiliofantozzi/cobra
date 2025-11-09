import { assertDomain } from "../errors";
import type { ContactId, CustomerCompanyId, OrganizationId } from "../types";

export interface Contact {
  id: ContactId;
  organizationId: OrganizationId;
  customerCompanyId: CustomerCompanyId;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  position?: string;
  notes?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactDraft {
  organizationId: OrganizationId;
  customerCompanyId: CustomerCompanyId;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  position?: string;
  notes?: string;
  isPrimary?: boolean;
}

export function createContact(input: ContactDraft): Omit<Contact, "id" | "createdAt" | "updatedAt"> {
  const { email, phoneNumber, whatsappNumber } = input;
  assertDomain(Boolean(email || phoneNumber || whatsappNumber), "Contact requires at least one communication channel", {
    code: "contact.missing_channel",
  });

  return {
    organizationId: input.organizationId,
    customerCompanyId: input.customerCompanyId,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    email: email?.trim().toLowerCase() || undefined,
    phoneNumber: normalizePhone(phoneNumber),
    whatsappNumber: normalizePhone(whatsappNumber),
    position: input.position?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    isPrimary: input.isPrimary ?? false,
  };
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^+\d]/g, "");
  assertDomain(digits.length >= 6, "Phone numbers should contain at least 6 digits including country code when available", {
    code: "contact.invalid_phone",
  });
  return digits;
}

export type ContactCreateData = ReturnType<typeof createContact>;

