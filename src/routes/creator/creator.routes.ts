import { Router } from 'express';
import { authenticate } from '../../middleware/auth/authenticate.js';
import { authorizeUser } from '../../middleware/auth/authorize.js';
import {
  getCreatorProfile,
  updateCreatorProfile,
  getCreatorStats,
  getCreatorReviews,
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../../controllers/creator/creator.controller.js';
import { ALL_CREATORS } from '../../constants/roles.js';

const router = Router();

router.get(
  '/me/stats',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  getCreatorStats(),
);

router.get(
  '/me/reviews',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  getCreatorReviews(),
);

router.put(
  '/me',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  updateCreatorProfile(),
);

router.get(
  '/me/favorites',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  getFavorites(),
);

router.post(
  '/me/favorites/:campaignId',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  addFavorite(),
);

router.delete(
  '/me/favorites/:campaignId',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  removeFavorite(),
);

router.get(
  '/:creatorId',
  getCreatorProfile(),
);

export { router as creatorRoutes };

