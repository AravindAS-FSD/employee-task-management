import { AppError } from '../utils/AppError.js';

/** Validates req.body / req.query with a zod schema. Parsed output lands in req.validated. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    return next(
      new AppError(400, 'Invalid data', {
        code: 'VALIDATION_ERROR',
        details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      })
    );
  }
  req.validated = { ...req.validated, [source]: result.data };
  next();
};
