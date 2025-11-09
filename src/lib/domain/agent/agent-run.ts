import { DomainError } from "../errors";
import type {
  AgentActionLogId,
  AgentRunId,
  CollectionCaseId,
  OrganizationId,
  JsonValue,
} from "../types";

export type AgentRunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface AgentRun {
  id: AgentRunId;
  organizationId: OrganizationId;
  collectionCaseId: CollectionCaseId;
  status: AgentRunStatus;
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
  metadata?: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentActionLog {
  id: AgentActionLogId;
  organizationId: OrganizationId;
  agentRunId: AgentRunId;
  collectionCaseId: CollectionCaseId;
  type: AgentActionType;
  status: AgentActionStatus;
  summary?: string;
  payload?: JsonValue;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AgentActionType =
  | "SEND_MESSAGE"
  | "SCHEDULE_FOLLOW_UP"
  | "UPDATE_STATUS"
  | "ESCALATE"
  | "CLOSE_CASE"
  | "CLASSIFY_RESPONSE"
  | "LOG_NOTE";

export type AgentActionStatus = "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED";

const RUN_STATUS_TRANSITIONS: Record<AgentRunStatus, AgentRunStatus[]> = {
  PENDING: ["RUNNING", "CANCELLED"],
  RUNNING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export function transitionAgentRunStatus(current: AgentRunStatus, next: AgentRunStatus): AgentRunStatus {
  if (current === next) return current;
  const allowed = RUN_STATUS_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new DomainError(`Agent run cannot transition from ${current} to ${next}`, {
      code: "agent_run.invalid_status_transition",
    });
  }
  return next;
}

export function finalizeAgentRun(run: AgentRun, outcome: { status: "COMPLETED" | "FAILED" | "CANCELLED"; error?: string }): AgentRun {
  const nextStatus = transitionAgentRunStatus(run.status, outcome.status);

  return {
    ...run,
    status: nextStatus,
    finishedAt: new Date(),
    error: outcome.status === "FAILED" ? outcome.error ?? "Unknown agent failure" : undefined,
  };
}

export function startAgentRun(run: AgentRun): AgentRun {
  const nextStatus = transitionAgentRunStatus(run.status, "RUNNING");
  return {
    ...run,
    status: nextStatus,
    startedAt: new Date(),
  };
}

