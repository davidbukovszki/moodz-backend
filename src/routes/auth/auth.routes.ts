import { Router } from 'express';
import {
  registerCreator,
  registerVenue,
  loginCreator,
  loginVenue,
  refreshToken,
  getMe,
} from '../../controllers/auth/auth.controller.js';
import { authenticate } from '../../middleware/auth/authenticate.js';

const router = Router();

router.post('/creator/register', registerCreator());

router.post('/venue/register', registerVenue());

router.post('/creator/login', loginCreator());

router.post('/venue/login', loginVenue());

router.post('/refresh', refreshToken());

router.get('/me', authenticate(), getMe());

export { router as authRoutes };

