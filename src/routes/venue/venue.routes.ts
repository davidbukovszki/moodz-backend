import { Router } from 'express';
import { authenticate } from '../../middleware/auth/authenticate.js';
import { authorizeUser } from '../../middleware/auth/authorize.js';
import {
  getVenueProfile,
  updateVenueProfile,
  getVenueStats,
  getVenueActivity,
  getVenueReviews,
} from '../../controllers/venue/venue.controller.js';
import { ALL_VENUES } from '../../constants/roles.js';

const router = Router();

router.get(
  '/me/stats',
  authenticate(),
  authorizeUser(ALL_VENUES),
  getVenueStats(),
);

router.get(
  '/me/activity',
  authenticate(),
  authorizeUser(ALL_VENUES),
  getVenueActivity(),
);

router.get(
  '/me/reviews',
  authenticate(),
  authorizeUser(ALL_VENUES),
  getVenueReviews(),
);

router.put(
  '/me',
  authenticate(),
  authorizeUser(ALL_VENUES),
  updateVenueProfile(),
);

router.get(
  '/:venueId',
  getVenueProfile(),
);

export { router as venueRoutes };

