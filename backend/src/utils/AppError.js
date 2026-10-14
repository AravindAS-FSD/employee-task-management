const DEFAULT_CODES = { 400: 'BAD_REQUEST', 404: 'NOT_FOUND', 409: 'CONFLICT' };

export class AppError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code ?? DEFAULT_CODES[status] ?? 'ERROR';
    this.details = details;
  }
}

/** A 400 for a violated business rule (as opposed to malformed input). */
export const rule = (message, details) =>
  new AppError(400, message, { code: 'BUSINESS_RULE_VIOLATION', details });

export const notFound = (entity) => new AppError(404, `${entity} not found`, { code: 'NOT_FOUND' });
