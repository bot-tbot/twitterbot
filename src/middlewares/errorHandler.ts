import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import * as Sentry from '@sentry/node';
import { BadRequestError, NotAuthorizedError, NotFoundError, InternalServerError } from '../controllers/errors';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Set default status code
  const statusCode =
    err instanceof BadRequestError
      ? 400
      : err instanceof NotAuthorizedError
        ? 401
        : err instanceof NotFoundError
          ? 404
          : err instanceof InternalServerError
            ? 500
            : 500;

  if (statusCode === 500) {
    console.error('Error:', err);

    if (process.env.NODE_ENV === 'production') {
      // Capture error in Sentry
      Sentry.captureException(err, {
        tags: {
          'error.name': err.name,
          'error.statusCode':
            err instanceof BadRequestError
              ? 400
              : err instanceof NotAuthorizedError
                ? 401
                : err instanceof NotFoundError
                  ? 404
                  : err instanceof InternalServerError
                    ? 500
                    : 500,
        },
        extra: {
          path: req.path,
          method: req.method,
          query: req.query,
          body: req.body,
          headers: req.headers,
          details: 'details' in err ? (err as any).details : undefined,
        },
      });
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: err.message,
    details: 'details' in err ? (err as any).details : undefined,
  });
};
