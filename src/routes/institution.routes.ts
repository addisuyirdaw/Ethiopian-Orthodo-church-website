import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { institutionController } from '../controllers/institution.controller';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => institutionController.listPublicInstitutions(req, res)),
);

router.get(
  '/dioceses',
  asyncHandler(async (req, res) => institutionController.listDioceses(req, res)),
);

router.get(
  '/dioceses/:dioceseId/parishes',
  asyncHandler(async (req, res) => institutionController.listParishesByDiocese(req, res)),
);

router.get(
  '/:institutionId/priests',
  asyncHandler(async (req, res) => institutionController.listInstitutionPriests(req, res)),
);


router.use(authenticateJwt);

router.get(
  '/hierarchy',
  asyncHandler(async (req, res) => institutionController.getHierarchy(req, res)),
);

export default router;
