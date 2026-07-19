// src/controllers/member.controller.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const ProfileUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  christianName: z.string().optional(),
  birthDate: z.string().optional(),
  phoneNumber: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  baptismStatus: z.string().optional(),
  photoUrl: z.string().optional(),
});

export class MemberController {
  // GET /members/profile
  async getProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const profile = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        christianName: true,
        birthDate: true,
        phoneNumber: true,
        region: true,
        city: true,
        address: true,
        baptismStatus: true,
        photoUrl: true,
        sex: true,
        age: true,
        spiritualFatherId: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            nameAm: true,
            nameEn: true,
          },
        },
        spiritualFather: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.status(200).json(profile);
  }

  // PUT /members/profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const data = ProfileUpdateSchema.parse(req.body);

    let age: number | undefined;
    let parsedBirthDate: Date | undefined;
    if (data.birthDate) {
      parsedBirthDate = new Date(data.birthDate);
      const today = new Date();
      let calculatedAge = today.getFullYear() - parsedBirthDate.getFullYear();
      const m = today.getMonth() - parsedBirthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < parsedBirthDate.getDate())) {
        calculatedAge--;
      }
      age = calculatedAge;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: data.fullName,
        christianName: data.christianName,
        birthDate: parsedBirthDate,
        age: age,
        phoneNumber: data.phoneNumber,
        region: data.region,
        city: data.city,
        address: data.address,
        baptismStatus: data.baptismStatus,
        photoUrl: data.photoUrl,
      },
    });

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: updated,
    });
  }

  // GET /priests
  async getPriests(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // List priests in the member's current parish/institution
    const priests = await prisma.user.findMany({
      where: {
        institutionId: req.user.institutionId,
        ecclesiasticalRole: 'PRIEST',
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        location: true,
        photoUrl: true,
        biography: true,
        serviceStartDate: true,
        currentStatus: true,
        institution: {
          select: {
            nameAm: true,
            nameEn: true,
          },
        },
      },
    });

    res.status(200).json(priests);
  }

  // GET /priests/:id
  async getPriestById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const priest = await prisma.user.findFirst({
      where: {
        id,
        ecclesiasticalRole: 'PRIEST',
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        location: true,
        photoUrl: true,
        biography: true,
        serviceStartDate: true,
        currentStatus: true,
        institution: {
          select: {
            nameAm: true,
            nameEn: true,
          },
        },
      },
    });


    if (!priest) {
      res.status(404).json({ error: 'Priest not found.' });
      return;
    }

    res.status(200).json(priest);
  }

  // POST /assignment/request
  async createRequest(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { priestId, notes } = req.body;
    if (!priestId) {
      res.status(400).json({ error: 'Priest ID is required.' });
      return;
    }

    // Ensure target priest exists
    const priestExists = await prisma.user.findFirst({
      where: { id: priestId, ecclesiasticalRole: 'PRIEST', deletedAt: null },
    });
    if (!priestExists) {
      res.status(404).json({ error: 'Selected priest does not exist.' });
      return;
    }

    // Check if there is already an active/pending request for this member
    const existingPending = await prisma.priestAssignmentRequest.findFirst({
      where: {
        memberId: req.user.id,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      res.status(400).json({ error: 'You already have a pending request.' });
      return;
    }

    const request = await prisma.priestAssignmentRequest.create({
      data: {
        memberId: req.user.id,
        priestId,
        notes: notes || null,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Request sent successfully.',
      request,
    });
  }

  // GET /assignment/status
  async getRequestStatus(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const request = await prisma.priestAssignmentRequest.findFirst({
      where: { memberId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        priest: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      res.status(200).json({ status: 'NONE' });
      return;
    }

    res.status(200).json(request);
  }
}

export const memberController = new MemberController();
