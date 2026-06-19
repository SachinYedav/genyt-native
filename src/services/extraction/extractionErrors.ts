import type { ExtractionErrorCode } from './types';

const errorPattern =
  /GENYT_(NETWORK|INVALID_URL|VIDEO_UNAVAILABLE|LOGIN_REQUIRED|EXTRACTOR_OUTDATED|UNKNOWN):(.+)/;

export class ExtractionError extends Error {
  constructor(
    readonly code: ExtractionErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ExtractionError';
  }
}

export function normalizeExtractionError(error: unknown): ExtractionError {
  if (error instanceof ExtractionError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const match = errorPattern.exec(message);

  if (match) {
    return new ExtractionError(match[1] as ExtractionErrorCode, match[2], {
      cause: error,
    });
  }

  return new ExtractionError('UNKNOWN', message || 'Unknown extraction error', {
    cause: error,
  });
}
