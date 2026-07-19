// src/controllers/assignment.controller.ts
// Handles spiritual father assignment requests (Phase 2)
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class AssignmentController {
  // GET /priest/dashboard
  async getDashboard(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (req.user.ecclesiasticalRole !== 'PRIEST') {
      res.status(403).json({ error: 'Forbidden: Priests only.' }); return;
    }

    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.priestAssignmentRequest.count({ where: { priestId: req.user.id, status: 'PENDING' } }),
      prisma.user.count({ where: { spiritualFatherId: req.user.id, deletedAt: null } }),
      prisma.priestAssignmentRequest.count({ where: { priestId: req.user.id, status: 'REJECTED' } }),
    ]);

    res.status(200).json({ pendingCount, approvedCount, rejectedCount });
  }

  // GET /priest/requests  (all statuses for this priest, sorted by status then date)
  async getPriestRequests(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (req.user.ecclesiasticalRole !== 'PRIEST') {
      res.status(403).json({ error: 'Forbidden: Priests only.' }); return;
    }

    const statusFilter = req.query.status as string | undefined;

    const requests = await prisma.priestAssignmentRequest.findMany({
      where: {
        priestId: req.user.id,
        ...(statusFilter ? { status: statusFilter as any } : {}),
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            email: true,
            christianName: true,
            baptismStatus: true,
            phoneNumber: true,
            region: true,
            city: true,
            address: true,
            sex: true,
            age: true,
            photoUrl: true,
          },
        },
      },
    });

    res.status(200).json(requests);
  }

  // POST /priest/requests/:id/approve
  async approveRequest(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (req.user.ecclesiasticalRole !== 'PRIEST') {
      res.status(403).json({ error: 'Forbidden: Priests only.' }); return;
    }

    const request = await prisma.priestAssignmentRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request || request.priestId !== req.user.id) {
      res.status(404).json({ error: 'Request not found.' }); return;
    }
    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'Request already processed.' }); return;
    }

    await prisma.$transaction([
      prisma.priestAssignmentRequest.update({
        where: { id: request.id },
        data: { status: 'APPROVED' },
      }),
      prisma.user.update({
        where: { id: request.memberId },
        data: { spiritualFatherId: req.user.id },
      }),
    ]);

    res.status(200).json({ message: 'ጥያቄው ተቀብሏል። ሙሉ የንስሐ ልጅ ሆኗል።' });
  }

  // POST /priest/requests/:id/reject
  async rejectRequest(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (req.user.ecclesiasticalRole !== 'PRIEST') {
      res.status(403).json({ error: 'Forbidden: Priests only.' }); return;
    }

    const request = await prisma.priestAssignmentRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request || request.priestId !== req.user.id) {
      res.status(404).json({ error: 'Request not found.' }); return;
    }
    if (request.status !== 'PENDING') {
      res.status(400).json({ error: 'Request already processed.' }); return;
    }

    await prisma.priestAssignmentRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED' },
    });

    res.status(200).json({ message: 'ጥያቄው ውድቅ ተደርጓል።' });
  }

  // GET /assignment/status  (member side)
  async getMemberRequestStatus(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const latest = await prisma.priestAssignmentRequest.findFirst({
      where: { memberId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        priest: {
          select: {
            id: true,
            fullName: true,
            email: true,
            photoUrl: true,
            location: true,
            institution: { select: { nameAm: true, nameEn: true } },
          },
        },
      },
    });

    res.status(200).json(latest ?? { status: 'NONE' });
  }

  // POST /assignment/request  (member side)
  async sendRequest(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { priestId, notes } = req.body;
    if (!priestId) {
      res.status(400).json({ error: 'Priest ID is required.' }); return;
    }

    const priest = await prisma.user.findFirst({
      where: { id: priestId, ecclesiasticalRole: 'PRIEST', deletedAt: null },
    });
    if (!priest) {
      res.status(404).json({ error: 'ካህኑ አልተገኘም።' }); return;
    }

    const existing = await prisma.priestAssignmentRequest.findFirst({
      where: { memberId: req.user.id, status: 'PENDING' },
    });
    if (existing) {
      res.status(400).json({ error: 'ቀደም ሲል ያልተፈቀደ ጥያቄ አለዎት።' }); return;
    }

    const request = await prisma.priestAssignmentRequest.create({
      data: {
        memberId: req.user.id,
        priestId,
        notes: notes ?? null,
        status: 'PENDING',
      },
    });

    res.status(201).json({ message: 'ጥያቄው ወደ ካህኑ ተልኳል።', request });
  }
}

export const assignmentController = new AssignmentController();
