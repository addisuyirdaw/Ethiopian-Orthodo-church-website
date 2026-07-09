import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { tenantRbac } from '../middleware/tenant-rbac.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { calendarController } from '../controllers/calendar.controller';

const router = Router();

router.use(authenticateJwt);

router.get(
  '/today',
  tenantRbac(),
  asyncHandler(async (req, res) => calendarController.today(req, res)),
);

export default router;
