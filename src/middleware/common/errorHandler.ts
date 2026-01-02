import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler() {
  return (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: err.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  };
}

