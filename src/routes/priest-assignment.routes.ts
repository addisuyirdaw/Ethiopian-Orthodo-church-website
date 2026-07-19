// src/routes/priest-assignment.routes.ts
// Priest-side assignment management (Phase 2) — separate from existing priest.routes.ts
import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { assignmentController } from '../controllers/assignment.controller';

const router = Router();
router.use(authenticateJwt);

// Dashboard stats (priests only, controller enforces role)
router.get('/dashboard', asyncHandler((req, res) => assignmentController.getDashboard(req, res)));

// Requests list
router.get('/requests', asyncHandler((req, res) => assignmentController.getPriestRequests(req, res)));

// Approve / reject
router.post('/requests/:id/approve', asyncHandler((req, res) => assignmentController.approveRequest(req, res)));
router.post('/requests/:id/reject', asyncHandler((req, res) => assignmentController.rejectRequest(req, res)));

export default router;
