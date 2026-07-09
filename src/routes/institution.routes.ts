import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { institutionController } from '../controllers/institution.controller';

const router = Router();

router.use(authenticateJwt);

router.get(
  '/hierarchy',
  asyncHandler(async (req, res) => institutionController.getHierarchy(req, res)),
);

export default router;
