import { assertDomain } from "../errors";
import type { ContactId, CustomerCompanyId, OrganizationId } from "../types";

import type { CommunicationChannel } from "../types";

export type ContactRole = "BILLING_AP" | "OPERATIONS" | "DECISION_MAKER" | "OTHER";
export type EmailStatus = "DELIVERABLE" | "BOUNCE" | "UNKNOWN";
export type WhatsAppStatus = "NOT_VALIDATED" | "VALIDATED" | "BLOCKED" | "UNKNOWN";

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
  role?: ContactRole;
  preferredChannel?: CommunicationChannel;
  emailStatus: EmailStatus;
  whatsappStatus: WhatsAppStatus;
  isBillingContact: boolean;
  optedOutEmail: boolean;
  optedOutEmailAt?: Date;
  optedOutWhatsapp: boolean;
  optedOutWhatsappAt?: Date;
  language?: string;
  timezone?: string;
  workingHoursWindow?: { start: string; end: string; days: number[] };
  hasOptedOut: boolean; // Deprecated, kept for backward compatibility
  consentDate?: Date;
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
  role?: ContactRole;
  preferredChannel?: CommunicationChannel;
  emailStatus?: EmailStatus;
  whatsappStatus?: WhatsAppStatus;
  isBillingContact?: boolean;
  optedOutEmail?: boolean;
  optedOutEmailAt?: Date;
  optedOutWhatsapp?: boolean;
  optedOutWhatsappAt?: Date;
  language?: string;
  timezone?: string;
  workingHoursWindow?: { start: string; end: string; days: number[] };
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
    role: input.role,
    preferredChannel: input.preferredChannel,
    emailStatus: input.emailStatus ?? "UNKNOWN",
    whatsappStatus: input.whatsappStatus ?? "NOT_VALIDATED",
    isBillingContact: input.isBillingContact ?? false,
    optedOutEmail: input.optedOutEmail ?? false,
    optedOutEmailAt: input.optedOutEmailAt,
    optedOutWhatsapp: input.optedOutWhatsapp ?? false,
    optedOutWhatsappAt: input.optedOutWhatsappAt,
    language: input.language,
    timezone: input.timezone,
    workingHoursWindow: input.workingHoursWindow,
    hasOptedOut: (input.optedOutEmail ?? false) || (input.optedOutWhatsapp ?? false), // Backward compatibility
    consentDate: undefined,
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

