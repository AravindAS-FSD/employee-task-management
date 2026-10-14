import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found', details: null });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ code: err.code, message: err.message, details: err.details ?? null });
  }

  // Mongo duplicate key (unique index on employeeId or email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    const label = field === 'email' ? 'Email' : field === 'employeeId' ? 'Employee ID' : field;
    return res.status(409).json({ code: 'DUPLICATE', message: `${label} already exists`, details: { field } });
  }

  // Malformed ObjectId in the URL
  if (err.name === 'CastError') {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found', details: null });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message, details: null });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Malformed JSON body', details: null });
  }

  console.error(err);
  return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Something went wrong', details: null });
}
