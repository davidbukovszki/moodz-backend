import { Router } from 'express';
import { authenticate } from '../../middleware/auth/authenticate.js';
import { authorizeUser } from '../../middleware/auth/authorize.js';
import { validateCampaign } from '../../middleware/campaign/validateCampaign.js';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
  getVenueCampaigns,
} from '../../controllers/campaign/campaign.controller.js';
import { ALL_USERS, ALL_VENUES } from '../../constants/roles.js';

const router = Router();

router.get(
  '/',
  getCampaigns(),
);

router.get(
  '/my',
  authenticate(),
  authorizeUser(ALL_VENUES),
  getVenueCampaigns(),
);

router.get(
  '/:campaignId',
  validateCampaign(false),
  getCampaign(),
);

router.post(
  '/',
  authenticate(),
  authorizeUser(ALL_VENUES),
  createCampaign(),
);

router.put(
  '/:campaignId',
  authenticate(),
  authorizeUser(ALL_VENUES),
  validateCampaign(true),
  updateCampaign(),
);

router.patch(
  '/:campaignId/status',
  authenticate(),
  authorizeUser(ALL_VENUES),
  validateCampaign(true),
  updateCampaignStatus(),
);

router.delete(
  '/:campaignId',
  authenticate(),
  authorizeUser(ALL_VENUES),
  validateCampaign(true),
  deleteCampaign(),
);

export { router as campaignRoutes };

