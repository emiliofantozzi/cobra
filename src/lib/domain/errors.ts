export class DomainError extends Error {
  readonly code?: string;

  constructor(message: string, options?: { code?: string; cause?: unknown }) {
    super(message);
    this.name = "DomainError";
    this.code = options?.code;
    if (options?.cause) {
      (this as Error).cause = options.cause;
    }
  }
}

export function assertDomain(condition: boolean, message: string, options?: { code?: string; cause?: unknown }): asserts condition {
  if (!condition) {
    throw new DomainError(message, options);
  }
}

