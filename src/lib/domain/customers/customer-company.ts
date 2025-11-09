import { assertDomain, DomainError } from "../errors";
import type { CustomerCompanyId, OrganizationId } from "../types";

export type CustomerCompanyStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface CustomerCompany {
  id: CustomerCompanyId;
  organizationId: OrganizationId;
  name: string;
  legalName?: string;
  taxId?: string;
  status: CustomerCompanyStatus;
  industry?: string;
  website?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date | null;
}

export interface CustomerCompanyDraft {
  organizationId: OrganizationId;
  name: string;
  legalName?: string;
  taxId?: string;
  industry?: string;
  website?: string;
  notes?: string;
  status?: CustomerCompanyStatus;
}

export function createCustomerCompany(input: CustomerCompanyDraft): Omit<CustomerCompany, "id" | "createdAt" | "updatedAt"> {
  const trimmedName = input.name.trim();
  assertDomain(trimmedName.length > 0, "Customer company requires a non-empty name", { code: "customer_company.invalid_name" });

  const status: CustomerCompanyStatus = input.status ?? "ACTIVE";

  if (input.taxId) {
    const taxId = input.taxId.trim();
    assertDomain(taxId.length > 0, "Tax ID must be non-empty when provided", { code: "customer_company.invalid_tax_id" });
  }

  return {
    organizationId: input.organizationId,
    name: trimmedName,
    legalName: input.legalName?.trim() || undefined,
    taxId: input.taxId?.trim() || undefined,
    status,
    industry: input.industry?.trim() || undefined,
    website: input.website?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    archivedAt: status === "ARCHIVED" ? new Date() : null,
  };
}

export function transitionCustomerCompanyStatus(current: CustomerCompanyStatus, next: CustomerCompanyStatus): CustomerCompanyStatus {
  if (current === next) {
    return current;
  }

  if (current === "ARCHIVED" && next !== "ARCHIVED") {
    throw new DomainError("Archived customer companies cannot return to an active state without restoration workflow", {
      code: "customer_company.invalid_transition",
    });
  }

  return next;
}

export type CustomerCompanyCreateData = ReturnType<typeof createCustomerCompany>;

