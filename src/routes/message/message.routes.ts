import { Router } from 'express';
import { authenticate } from '../../middleware/auth/authenticate.js';
import { authorizeUser } from '../../middleware/auth/authorize.js';
import { validateConversation } from '../../middleware/message/validateConversation.js';
import {
  getConversations,
  getConversation,
  startConversation,
  sendMessage,
  markAsRead,
} from '../../controllers/message/message.controller.js';
import { ALL_USERS } from '../../constants/roles.js';

const router = Router();

router.get(
  '/',
  authenticate(),
  authorizeUser(ALL_USERS),
  getConversations(),
);

router.get(
  '/:conversationId',
  authenticate(),
  authorizeUser(ALL_USERS),
  validateConversation(),
  getConversation(),
);

router.post(
  '/',
  authenticate(),
  authorizeUser(ALL_USERS),
  startConversation(),
);

router.post(
  '/:conversationId/messages',
  authenticate(),
  authorizeUser(ALL_USERS),
  validateConversation(),
  sendMessage(),
);

router.put(
  '/:conversationId/read',
  authenticate(),
  authorizeUser(ALL_USERS),
  validateConversation(),
  markAsRead(),
);

export { router as messageRoutes };

