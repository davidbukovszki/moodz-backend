import { Router } from 'express';
import { authenticate } from '../../middleware/auth/authenticate.js';
import { authorizeUser } from '../../middleware/auth/authorize.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../../controllers/notification/notification.controller.js';
import { ALL_USERS } from '../../constants/roles.js';

const router = Router();

router.get(
  '/',
  authenticate(),
  authorizeUser(ALL_USERS),
  getNotifications(),
);

router.put(
  '/:id/read',
  authenticate(),
  authorizeUser(ALL_USERS),
  markAsRead(),
);

router.put(
  '/read-all',
  authenticate(),
  authorizeUser(ALL_USERS),
  markAllAsRead(),
);

export { router as notificationRoutes };

