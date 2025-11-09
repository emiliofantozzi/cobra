import type { JsonValue, OrganizationId } from "../types";

export type EscalationChannel = "EMAIL" | "WHATSAPP" | "SMS" | "PHONE" | "OTHER" | null;

export interface AgentConfig {
  organizationId: OrganizationId;
  defaultTimezone?: string;
  escalationEmail?: string;
  escalationPhone?: string;
  escalationChannel: EscalationChannel;
  llmModel?: string;
  workingHours?: JsonValue;
  updatedAt: Date;
}

export interface AgentConfigDraft {
  organizationId: OrganizationId;
  defaultTimezone?: string;
  escalationEmail?: string;
  escalationPhone?: string;
  escalationChannel?: EscalationChannel;
  llmModel?: string;
  workingHours?: JsonValue;
}

export function applyAgentConfigPatch(current: AgentConfig, patch: AgentConfigDraft): AgentConfig {
  return {
    organizationId: current.organizationId,
    defaultTimezone: patch.defaultTimezone ?? current.defaultTimezone,
    escalationEmail: patch.escalationEmail ?? current.escalationEmail,
    escalationPhone: patch.escalationPhone ?? current.escalationPhone,
    escalationChannel: patch.escalationChannel ?? current.escalationChannel,
    llmModel: patch.llmModel ?? current.llmModel,
    workingHours: patch.workingHours ?? current.workingHours,
    updatedAt: new Date(),
  };
}

