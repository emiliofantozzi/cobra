import {
  createCollectionCase,
  transitionCollectionStage,
  transitionCollectionStatus,
  determineEscalationNeeded,
  createCommunicationAttempt,
  markCommunicationAsSent,
  type CollectionCase,
  type CollectionCaseDraft,
  type CollectionCaseId,
  type CollectionStage,
  type CollectionCaseStatus,
  type CommunicationAttempt,
  type CommunicationAttemptDraft,
  type CommunicationStatus,
  type ContactId,
  type CollectionRiskLevel,
} from "../domain";
import {
  type CollectionCaseRepository,
  type CommunicationAttemptRepository,
  type AgentRunRepository,
  type RepositoryContext,
  type PaginatedResult,
  type ListCollectionCasesParams,
  type ListCommunicationAttemptsParams,
} from "../repositories";

export interface CollectionCasesServiceDependencies {
  collectionCaseRepository: CollectionCaseRepository;
  communicationAttemptRepository: CommunicationAttemptRepository;
  agentRunRepository: AgentRunRepository;
}

export function createCollectionCasesService(deps: CollectionCasesServiceDependencies) {
  const { collectionCaseRepository, communicationAttemptRepository, agentRunRepository } = deps;

  const service = {
    async listCollectionCases(
      context: RepositoryContext,
      params?: ListCollectionCasesParams,
    ): Promise<PaginatedResult<CollectionCase>> {
      return collectionCaseRepository.list(context, params);
    },

    async getCollectionCase(context: RepositoryContext, collectionCaseId: CollectionCaseId): Promise<CollectionCase | null> {
      return collectionCaseRepository.findById(context, collectionCaseId);
    },

    async openCollectionCase(
      context: RepositoryContext,
      draft: CollectionCaseDraft,
    ): Promise<CollectionCase> {
      const sanitized = createCollectionCase(draft);
      return collectionCaseRepository.create(context, sanitized);
    },

    async changeStage(
      context: RepositoryContext,
      collectionCaseId: CollectionCaseId,
      nextStage: CollectionStage,
    ): Promise<CollectionCase> {
      const existing = await collectionCaseRepository.findById(context, collectionCaseId);
      if (!existing) {
        throw new Error(`Collection case ${collectionCaseId} not found`);
      }

      const stage = transitionCollectionStage(existing.stage, nextStage);
      return collectionCaseRepository.setStage(context, collectionCaseId, stage);
    },

    async changeStatus(
      context: RepositoryContext,
      collectionCaseId: CollectionCaseId,
      nextStatus: CollectionCaseStatus,
    ): Promise<CollectionCase> {
      const existing = await collectionCaseRepository.findById(context, collectionCaseId);
      if (!existing) {
        throw new Error(`Collection case ${collectionCaseId} not found`);
      }

      const status = transitionCollectionStatus(existing.status, nextStatus);
      return collectionCaseRepository.setStatus(context, collectionCaseId, status);
    },

    async updateRiskLevel(
      context: RepositoryContext,
      collectionCaseId: CollectionCaseId,
      riskLevel: CollectionRiskLevel,
    ): Promise<CollectionCase> {
      return collectionCaseRepository.update(context, collectionCaseId, { riskLevel });
    },

    async scheduleNextAction(
      context: RepositoryContext,
      collectionCaseId: CollectionCaseId,
      nextActionAt: Date | null,
    ): Promise<CollectionCase> {
      return collectionCaseRepository.update(context, collectionCaseId, { nextActionAt: nextActionAt ?? undefined });
    },

    async listCommunications(
      context: RepositoryContext,
      params?: ListCommunicationAttemptsParams,
    ): Promise<PaginatedResult<CommunicationAttempt>> {
      return communicationAttemptRepository.list(context, params);
    },

    async logCommunication(
      context: RepositoryContext,
      draft: CommunicationAttemptDraft,
      options: { markAsSent?: boolean; sentAt?: Date; deliveredAt?: Date } = {},
    ): Promise<CommunicationAttempt> {
      const sanitized = createCommunicationAttempt(draft);
      let attempt = await communicationAttemptRepository.create(context, sanitized);

      if (options.markAsSent) {
        attempt = markCommunicationAsSent(attempt, { sentAt: options.sentAt, deliveredAt: options.deliveredAt });
        attempt = await communicationAttemptRepository.updateStatus(context, attempt.id, attempt.status);
        await communicationAttemptRepository.appendDeliveryMetadata(context, attempt.id, {
          sentAt: attempt.sentAt,
          deliveredAt: attempt.deliveredAt,
        });
      }

      return attempt;
    },

    async updateCommunicationStatus(
      context: RepositoryContext,
      communicationId: CommunicationAttempt["id"],
      status: CommunicationStatus,
      metadata?: Partial<Pick<CommunicationAttempt, "sentAt" | "deliveredAt" | "readAt" | "error">>,
    ): Promise<CommunicationAttempt> {
      let attempt = await communicationAttemptRepository.updateStatus(context, communicationId, status);
      if (metadata) {
        attempt = await communicationAttemptRepository.appendDeliveryMetadata(context, communicationId, metadata);
      }
      return attempt;
    },

    async determineIfEscalationNeeded(context: RepositoryContext, collectionCaseId: CollectionCaseId): Promise<boolean> {
      const existing = await collectionCaseRepository.findById(context, collectionCaseId);
      if (!existing) return false;
      return determineEscalationNeeded(existing);
    },

    async markPrimaryContact(
      context: RepositoryContext,
      collectionCaseId: CollectionCaseId,
      contactId: ContactId,
    ): Promise<CollectionCase> {
      return collectionCaseRepository.update(context, collectionCaseId, { primaryContactId: contactId });
    },

    async listAgentRuns(
      context: RepositoryContext,
      params: Parameters<AgentRunRepository["list"]>[1],
    ) {
      return agentRunRepository.list(context, params);
    },
  };

  return service;
}

