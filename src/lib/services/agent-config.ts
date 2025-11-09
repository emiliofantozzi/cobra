import { applyAgentConfigPatch, type AgentConfig, type AgentConfigDraft } from "../domain";
import { type AgentConfigRepository, type RepositoryContext } from "../repositories";

export interface AgentConfigServiceDependencies {
  agentConfigRepository: AgentConfigRepository;
}

export function createAgentConfigService(deps: AgentConfigServiceDependencies) {
  const { agentConfigRepository } = deps;

  return {
    async getAgentConfig(context: RepositoryContext): Promise<AgentConfig | null> {
      return agentConfigRepository.get(context);
    },

    async upsertAgentConfig(context: RepositoryContext, draft: AgentConfigDraft): Promise<AgentConfig> {
      const existing = await agentConfigRepository.get(context);
      if (!existing) {
        return agentConfigRepository.upsert(context, { ...draft, organizationId: context.organizationId });
      }

      const updated = applyAgentConfigPatch(existing, draft);
      return agentConfigRepository.upsert(context, updated);
    },
  };
}

