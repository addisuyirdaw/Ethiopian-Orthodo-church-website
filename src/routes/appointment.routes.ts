import { Router } from 'express';
import { authenticateJwt, requirePriestRole } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { appointmentController } from '../controllers/appointment.controller';

const router = Router();

// ── Follower Routes (any authenticated user) ──────────────────────────────────

/** POST /api/v1/appointments — book an appointment with your spiritual father */
router.post(
  '/',
  authenticateJwt,
  asyncHandler((req, res, next) => appointmentController.book(req, res, next)),
);

/** GET /api/v1/appointments/my — see my own appointments */
router.get(
  '/my',
  authenticateJwt,
  asyncHandler((req, res, next) => appointmentController.myAppointments(req, res, next)),
);

/** GET /api/v1/appointments/:id — see specific appointment details */
router.get(
  '/:id',
  authenticateJwt,
  asyncHandler((req, res, next) => appointmentController.getById(req, res, next)),
);

/** PUT /api/v1/appointments/:id/cancel — cancel a pending appointment */
router.put(
  '/:id/cancel',
  authenticateJwt,
  asyncHandler((req, res, next) => appointmentController.cancel(req, res, next)),
);

// ── Priest Routes (PRIEST / BISHOP / higher only) ─────────────────────────────


/** GET /api/v1/appointments/priest — see my appointment queue */
router.get(
  '/priest',
  authenticateJwt,
  requirePriestRole,
  asyncHandler((req, res, next) => appointmentController.priestQueue(req, res, next)),
);

/** GET /api/v1/appointments/priest/stats — dashboard count by status */
router.get(
  '/priest/stats',
  authenticateJwt,
  requirePriestRole,
  asyncHandler((req, res, next) => appointmentController.priestStats(req, res, next)),
);

/** POST /api/v1/appointments/:id/decide — approve / reject / reschedule / complete */
router.post(
  '/:id/decide',
  authenticateJwt,
  requirePriestRole,
  asyncHandler((req, res, next) => appointmentController.decide(req, res, next)),
);

export default router;
