import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Canonical jurisdiction violation: Access denied.') {
    super(403, message, 'Forbidden');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(404, message, 'NotFound');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Invalid email or password.') {
    super(401, message, 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export class CanonicalValidationError extends AppError {
  constructor(message = 'Canonical validation failed.') {
    super(422, message, 'CanonicalValidationError');
    this.name = 'CanonicalValidationError';
  }
}

export class CanonicalStatusException extends AppError {
  constructor(message = 'የቀኖናዊ አቋም ችግር፡ የአገልጋዩ ደረጃ ንቁ አይደለም።') {
    super(422, message, 'CanonicalStatusException');
    this.name = 'CanonicalStatusException';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'A conflicting resource already exists.') {
    super(409, message, 'Conflict');
    this.name = 'ConflictError';
  }
}

/**
 * Thrown when a mutation is attempted on a SacramentalRecord that has an
 * active SacramentSeal. The record is permanently locked and cannot be
 * modified or deleted.
 */
export class SealedRecordError extends AppError {
  constructor(recordId: string) {
    super(
      409,
      `Record ${recordId} is cryptographically sealed and cannot be mutated.`,
      'SealedRecordError',
    );
    this.name = 'SealedRecordError';
  }
}

interface ErrorLogMetadata {
  method: string;
  path: string;
  userId?: string;
  institutionId?: string;
  errorName: string;
  message: string;
  stack?: string;
}

function logError(metadata: ErrorLogMetadata): void {
  const payload = {
    level: 'error',
    timestamp: new Date().toISOString(),
    ...metadata,
  };
  console.error(JSON.stringify(payload));
}

function isPrismaError(error: unknown): error is PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const baseMetadata: Omit<ErrorLogMetadata, 'errorName' | 'message'> = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    institutionId: req.user?.institutionId,
  };

  if (err instanceof ZodError) {
    logError({
      ...baseMetadata,
      errorName: 'ValidationError',
      message: err.message,
    });
    res.status(400).json({
      error: 'ValidationError',
      message: 'Request validation failed.',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    logError({
      ...baseMetadata,
      errorName: err.name,
      message: err.message,
    });
    res.status(err.statusCode).json({
      error: err.code ?? err.name,
      message: err.message,
    });
    return;
  }

  if (err instanceof Error && err.name === 'ForbiddenError') {
    logError({
      ...baseMetadata,
      errorName: err.name,
      message: err.message,
    });
    res.status(403).json({
      error: 'Forbidden',
      message: err.message,
    });
    return;
  }

  if (isPrismaError(err)) {
    logError({
      ...baseMetadata,
      errorName: 'DatabaseError',
      message: `[${err.code}] ${err.message}`,
      stack: err.stack,
    });
    res.status(500).json({
      error: 'InternalServerError',
      message: 'A database error occurred. Please try again later.',
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  const stack = err instanceof Error ? err.stack : undefined;

  logError({
    ...baseMetadata,
    errorName: err instanceof Error ? err.name : 'UnknownError',
    message,
    stack,
  });

  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred.',
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
