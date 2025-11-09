import type { OrganizationId } from "../domain";

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string | null;
  totalCount?: number;
}

export interface RepositoryContext {
  organizationId: OrganizationId;
  actorId?: string;
}

export type SortDirection = "asc" | "desc";

export class RepositoryNotImplementedError extends Error {
  constructor(repositoryName: string) {
    super(`${repositoryName} repository is not implemented yet`);
    this.name = "RepositoryNotImplementedError";
  }
}

