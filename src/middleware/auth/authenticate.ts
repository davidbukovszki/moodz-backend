import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt.js';
import { sendError } from '../../utils/response.js';

export function authenticate() {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = verifyAccessToken(token);
      res.locals.userId = payload.userId;
      res.locals.userType = payload.userType;
      next();
    } catch {
      return sendError(res, 'Invalid or expired token', 401);
    }
  };
}

