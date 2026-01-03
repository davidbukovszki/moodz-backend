import { Router } from 'express';
import { authenticate } from '../../middleware/auth/authenticate.js';
import { authorizeUser } from '../../middleware/auth/authorize.js';
import { validateApplication } from '../../middleware/application/validateApplication.js';
import {
  applyToCampaign,
  getApplication,
  getCreatorApplications,
  getVenueApplications,
  getCampaignApplications,
  updateApplication,
  cancelApplication,
  checkApplicationStatus,
} from '../../controllers/application/application.controller.js';
import { ALL_USERS, ALL_CREATORS, ALL_VENUES } from '../../constants/roles.js';

const router = Router();

router.get(
  '/my',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  getCreatorApplications(),
);

router.get(
  '/venue',
  authenticate(),
  authorizeUser(ALL_VENUES),
  getVenueApplications(),
);

router.get(
  '/campaign/:campaignId',
  authenticate(),
  authorizeUser(ALL_VENUES),
  getCampaignApplications(),
);

router.get(
  '/check',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  checkApplicationStatus(),
);

router.get(
  '/:applicationId',
  authenticate(),
  authorizeUser(ALL_USERS),
  validateApplication(true),
  getApplication(),
);

router.post(
  '/campaign/:campaignId',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  applyToCampaign(),
);

router.put(
  '/:applicationId',
  authenticate(),
  authorizeUser(ALL_VENUES),
  validateApplication(true),
  updateApplication(),
);

router.delete(
  '/:applicationId',
  authenticate(),
  authorizeUser(ALL_CREATORS),
  validateApplication(true),
  cancelApplication(),
);

export { router as applicationRoutes };

