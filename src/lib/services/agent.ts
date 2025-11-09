import {
  startAgentRun,
  finalizeAgentRun,
  transitionAgentRunStatus,
  type AgentRun,
  type AgentRunId,
  type AgentRunStatus,
  type AgentActionLog,
  type AgentActionStatus,
  type AgentActionType,
  type CollectionCaseId,
} from "../domain";
import {
  type AgentRunRepository,
  type CollectionCaseRepository,
  type RepositoryContext,
  type PaginatedResult,
  type ListAgentRunsParams,
} from "../repositories";

export interface AgentServiceDependencies {
  agentRunRepository: AgentRunRepository;
  collectionCaseRepository: CollectionCaseRepository;
}

export function createAgentService(deps: AgentServiceDependencies) {
  const { agentRunRepository, collectionCaseRepository } = deps;

  const service = {
    async listRuns(
      context: RepositoryContext,
      params?: ListAgentRunsParams,
    ): Promise<PaginatedResult<AgentRun>> {
      return agentRunRepository.list(context, params);
    },

    async startRun(
      context: RepositoryContext,
      payload: { collectionCaseId: CollectionCaseId; metadata?: AgentRun["metadata"] },
    ): Promise<AgentRun> {
      const collectionCase = await collectionCaseRepository.findById(context, payload.collectionCaseId);
      if (!collectionCase) {
        throw new Error(`Collection case ${payload.collectionCaseId} not found`);
      }

      const run = await agentRunRepository.create(context, {
        organizationId: context.organizationId,
        collectionCaseId: payload.collectionCaseId,
        status: "PENDING",
        metadata: payload.metadata,
      });

      const next = startAgentRun(run);
      return agentRunRepository.updateStatus(context, next.id, next.status);
    },

    async completeRun(
      context: RepositoryContext,
      agentRunId: AgentRunId,
      status: Extract<AgentRunStatus, "COMPLETED" | "FAILED" | "CANCELLED">,
      error?: string,
    ): Promise<AgentRun> {
      const run = await agentRunRepository.findById(context, agentRunId);
      if (!run) {
        throw new Error(`Agent run ${agentRunId} not found`);
      }

      const final = finalizeAgentRun(run, { status, error });
      return agentRunRepository.updateStatus(context, agentRunId, final.status, final.error);
    },

    async changeRunStatus(
      context: RepositoryContext,
      agentRunId: AgentRunId,
      status: AgentRunStatus,
    ): Promise<AgentRun> {
      const run = await agentRunRepository.findById(context, agentRunId);
      if (!run) {
        throw new Error(`Agent run ${agentRunId} not found`);
      }

      const next = transitionAgentRunStatus(run.status, status);
      return agentRunRepository.updateStatus(context, agentRunId, next);
    },

    async appendActionLog(
      context: RepositoryContext,
      payload: {
        agentRunId: AgentRunId;
        collectionCaseId: CollectionCaseId;
        type: AgentActionType;
        status: AgentActionStatus;
        summary?: string;
        metadata?: AgentActionLog["payload"];
        error?: string;
      },
    ): Promise<AgentActionLog> {
      return agentRunRepository.appendActionLog(context, {
        organizationId: context.organizationId,
        agentRunId: payload.agentRunId,
        collectionCaseId: payload.collectionCaseId,
        type: payload.type,
        status: payload.status,
        summary: payload.summary,
        payload: payload.metadata,
        error: payload.error,
      });
    },
  };

  return service;
}

