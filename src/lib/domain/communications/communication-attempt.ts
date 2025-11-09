import { assertDomain, DomainError } from "../errors";
import type {
  CollectionCaseId,
  CommunicationAttemptId,
  ContactId,
  OrganizationId,
  JsonValue,
} from "../types";

export type CommunicationChannel = "EMAIL" | "WHATSAPP" | "SMS" | "PHONE" | "OTHER";
export type CommunicationDirection = "OUTBOUND" | "INBOUND";
export type CommunicationStatus = "DRAFT" | "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "ACKNOWLEDGED";

export interface CommunicationAttempt {
  id: CommunicationAttemptId;
  organizationId: OrganizationId;
  collectionCaseId: CollectionCaseId;
  contactId?: ContactId;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  subject?: string;
  body?: string;
  payload?: JsonValue;
  externalId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationAttemptDraft {
  organizationId: OrganizationId;
  collectionCaseId: CollectionCaseId;
  contactId?: ContactId;
  channel: CommunicationChannel;
  direction?: CommunicationDirection;
  subject?: string;
  body?: string;
  payload?: JsonValue;
}

export function createCommunicationAttempt(input: CommunicationAttemptDraft): Omit<CommunicationAttempt, "id" | "status" | "externalId" | "sentAt" | "deliveredAt" | "readAt" | "error" | "createdAt" | "updatedAt"> & {
  status: CommunicationStatus;
} {
  assertDomain(input.channel !== "OTHER" || Boolean(input.subject || input.body), "Specify content when using OTHER channel", {
    code: "communication.invalid_content",
  });

  return {
    organizationId: input.organizationId,
    collectionCaseId: input.collectionCaseId,
    contactId: input.contactId,
    channel: input.channel,
    direction: input.direction ?? "OUTBOUND",
    status: "DRAFT",
    subject: input.subject?.trim() || undefined,
    body: input.body?.trim() || undefined,
    payload: input.payload,
  };
}

export function markCommunicationAsSent(
  attempt: CommunicationAttempt,
  timestamps: { sentAt?: Date; deliveredAt?: Date } = {},
): CommunicationAttempt {
  if (attempt.status === "FAILED") {
    throw new DomainError("Cannot mark failed communications as sent", {
      code: "communication.invalid_status",
    });
  }

  return {
    ...attempt,
    status: timestamps.deliveredAt ? "DELIVERED" : "SENT",
    sentAt: timestamps.sentAt ?? attempt.sentAt ?? new Date(),
    deliveredAt: timestamps.deliveredAt ?? attempt.deliveredAt,
  };
}

export type CommunicationAttemptCreateData = ReturnType<typeof createCommunicationAttempt>;

