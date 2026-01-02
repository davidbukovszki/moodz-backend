import { Router } from 'express';
import { authenticate } from '../../middleware/auth/authenticate.js';
import { authorizeUser } from '../../middleware/auth/authorize.js';
import {
  createReview,
  getCreatorReviews,
  getVenueReviews,
} from '../../controllers/review/review.controller.js';
import { ALL_USERS } from '../../constants/roles.js';

const router = Router();

router.post(
  '/application/:applicationId',
  authenticate(),
  authorizeUser(ALL_USERS),
  createReview(),
);

router.get(
  '/creator/:creatorId',
  getCreatorReviews(),
);

router.get(
  '/venue/:venueId',
  getVenueReviews(),
);

export { router as reviewRoutes };

