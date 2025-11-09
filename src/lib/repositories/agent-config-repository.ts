import type { AgentConfig, AgentConfigDraft, OrganizationId } from "../domain";
import { prisma } from "../db";
import type { RepositoryContext } from "./types";

export interface AgentConfigRepository {
  get(context: RepositoryContext, organizationId?: OrganizationId): Promise<AgentConfig | null>;
  upsert(context: RepositoryContext, draft: AgentConfigDraft): Promise<AgentConfig>;
}

function mapPrismaToDomain(prismaModel: {
  organizationId: string;
  defaultTimezone: string | null;
  escalationEmail: string | null;
  escalationPhone: string | null;
  escalationChannel: string | null;
  llmModel: string | null;
  workingHours: any;
  updatedAt: Date;
}): AgentConfig {
  return {
    organizationId: prismaModel.organizationId,
    defaultTimezone: prismaModel.defaultTimezone ?? undefined,
    escalationEmail: prismaModel.escalationEmail ?? undefined,
    escalationPhone: prismaModel.escalationPhone ?? undefined,
    escalationChannel: (prismaModel.escalationChannel ?? null) as AgentConfig["escalationChannel"],
    llmModel: prismaModel.llmModel ?? undefined,
    workingHours: prismaModel.workingHours ?? undefined,
    updatedAt: prismaModel.updatedAt,
  };
}

export function createAgentConfigRepository(): AgentConfigRepository {
  return {
    async get(context, organizationId) {
      const orgId = organizationId ?? context.organizationId;
      const result = await prisma.agentConfig.findUnique({
        where: {
          organizationId: orgId,
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async upsert(context, draft) {
      const result = await prisma.agentConfig.upsert({
        where: {
          organizationId: draft.organizationId,
        },
        create: {
          organizationId: draft.organizationId,
          defaultTimezone: draft.defaultTimezone,
          escalationEmail: draft.escalationEmail,
          escalationPhone: draft.escalationPhone,
          escalationChannel: draft.escalationChannel ?? null,
          llmModel: draft.llmModel,
          workingHours: draft.workingHours as any,
        },
        update: {
          defaultTimezone: draft.defaultTimezone,
          escalationEmail: draft.escalationEmail,
          escalationPhone: draft.escalationPhone,
          escalationChannel: draft.escalationChannel ?? null,
          llmModel: draft.llmModel,
          workingHours: draft.workingHours as any,
        },
      });
      return mapPrismaToDomain(result);
    },
  };
}
