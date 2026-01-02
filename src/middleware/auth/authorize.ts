import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../constants/roles.js';
import { sendError } from '../../utils/response.js';

export function authorizeUser(allowedRoles: UserRole[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const { userType } = res.locals;

    if (!userType) {
      return sendError(res, 'User not authenticated', 401);
    }

    if (!allowedRoles.includes(userType as UserRole)) {
      return sendError(res, 'Insufficient permissions', 403);
    }

    next();
  };
}

