// src/routes/member.routes.ts
import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { memberController } from '../controllers/member.controller';
import { assignmentController } from '../controllers/assignment.controller';

const router = Router();
router.use(authenticateJwt);

// Member profile
router.get('/profile', asyncHandler((req, res) => memberController.getProfile(req, res)));
router.put('/profile', asyncHandler((req, res) => memberController.updateProfile(req, res)));

// Priest discovery
router.get('/priests', asyncHandler((req, res) => memberController.getPriests(req, res)));
router.get('/priests/:id', asyncHandler((req, res) => memberController.getPriestById(req, res)));

// Assignment requests (member-side)
router.post('/assignment/request', asyncHandler((req, res) => assignmentController.sendRequest(req, res)));
router.get('/assignment/status', asyncHandler((req, res) => assignmentController.getMemberRequestStatus(req, res)));

export default router;
