import { assertDomain, DomainError } from "../errors";
import type {
  CollectionCaseId,
  ContactId,
  InvoiceId,
  OrganizationId,
  JsonValue,
} from "../types";

export type CollectionStage =
  | "INITIAL"
  | "REMINDER_1"
  | "REMINDER_2"
  | "ESCALATED"
  | "PROMISE_TO_PAY"
  | "RESOLVED"
  | "MANUAL_REVIEW";

export type CollectionCaseStatus = "ACTIVE" | "PAUSED" | "CLOSED";
export type CollectionRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CollectionCase {
  id: CollectionCaseId;
  organizationId: OrganizationId;
  invoiceId: InvoiceId;
  primaryContactId?: ContactId;
  stage: CollectionStage;
  status: CollectionCaseStatus;
  riskLevel: CollectionRiskLevel;
  lastCommunicationAt?: Date;
  nextActionAt?: Date;
  lastAgentActionAt?: Date;
  escalationAt?: Date;
  closedAt?: Date;
  summary?: string;
  metadata?: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionCaseDraft {
  organizationId: OrganizationId;
  invoiceId: InvoiceId;
  primaryContactId?: ContactId;
  stage?: CollectionStage;
  status?: CollectionCaseStatus;
  riskLevel?: CollectionRiskLevel;
  nextActionAt?: Date;
  summary?: string;
  metadata?: JsonValue;
}

export function createCollectionCase(input: CollectionCaseDraft): Omit<CollectionCase, "id" | "createdAt" | "updatedAt"> {
  const stage: CollectionStage = input.stage ?? "INITIAL";
  const status: CollectionCaseStatus = input.status ?? "ACTIVE";
  const risk: CollectionRiskLevel = input.riskLevel ?? "MEDIUM";

  assertStageAndStatus(stage, status);

  return {
    organizationId: input.organizationId,
    invoiceId: input.invoiceId,
    primaryContactId: input.primaryContactId,
    stage,
    status,
    riskLevel: risk,
    lastCommunicationAt: undefined,
    nextActionAt: input.nextActionAt,
    lastAgentActionAt: undefined,
    escalationAt: undefined,
    closedAt: status === "CLOSED" ? new Date() : undefined,
    summary: input.summary?.trim() || undefined,
    metadata: input.metadata,
  };
}

const STAGE_TRANSITIONS: Record<CollectionStage, CollectionStage[]> = {
  INITIAL: ["REMINDER_1", "PROMISE_TO_PAY", "MANUAL_REVIEW"],
  REMINDER_1: ["REMINDER_2", "PROMISE_TO_PAY", "MANUAL_REVIEW"],
  REMINDER_2: ["ESCALATED", "PROMISE_TO_PAY", "MANUAL_REVIEW"],
  ESCALATED: ["PROMISE_TO_PAY", "MANUAL_REVIEW", "RESOLVED"],
  PROMISE_TO_PAY: ["REMINDER_2", "ESCALATED", "RESOLVED", "MANUAL_REVIEW"],
  RESOLVED: [],
  MANUAL_REVIEW: ["REMINDER_1", "REMINDER_2", "ESCALATED", "RESOLVED"],
};

export function transitionCollectionStage(current: CollectionStage, next: CollectionStage): CollectionStage {
  if (current === next) {
    return current;
  }

  const allowed = STAGE_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new DomainError(`Stage transition ${current} -> ${next} is not allowed`, {
      code: "collection_case.invalid_stage_transition",
    });
  }

  return next;
}

export function transitionCollectionStatus(current: CollectionCaseStatus, next: CollectionCaseStatus): CollectionCaseStatus {
  if (current === next) {
    return current;
  }

  if (current === "CLOSED") {
    throw new DomainError("Closed collection cases cannot change status", {
      code: "collection_case.invalid_status_transition",
    });
  }

  return next;
}

export function determineEscalationNeeded(caseRecord: CollectionCase, now: Date = new Date()): boolean {
  if (caseRecord.status !== "ACTIVE") return false;
  if (!caseRecord.nextActionAt) return false;
  return caseRecord.nextActionAt <= now;
}

function assertStageAndStatus(stage: CollectionStage, status: CollectionCaseStatus) {
  if (stage === "RESOLVED" && status !== "CLOSED") {
    throw new DomainError("Resolved stage collection cases must be closed", {
      code: "collection_case.invalid_stage_status_pair",
    });
  }
  if (status === "CLOSED" && stage !== "RESOLVED") {
    throw new DomainError("Only resolved collection cases can be closed", {
      code: "collection_case.invalid_closed_stage",
    });
  }
  assertDomain(["ACTIVE", "PAUSED", "CLOSED"].includes(status), "Invalid collection case status");
}

export type CollectionCaseCreateData = ReturnType<typeof createCollectionCase>;

