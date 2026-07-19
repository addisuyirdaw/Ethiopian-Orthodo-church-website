import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { requirePriestRole } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { priestController } from '../controllers/priest.controller';

const router = Router();
router.use(authenticateJwt);
router.use(requirePriestRole);

// Get spiritual children of the logged‑in priest
router.get('/children', asyncHandler(priestController.getChildren));

// Get pending confession appointments for this priest
router.get('/appointments', asyncHandler(priestController.getPendingAppointments));

// Approve / Reject / Reschedule an appointment
router.post('/appointments/:id/decision', asyncHandler(priestController.decideAppointment));

// Add / update a pastoral log for a child
router.post('/children/:childId/log', asyncHandler(priestController.upsertPastoralLog));

export default router;
