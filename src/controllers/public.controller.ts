// src/controllers/public.controller.ts
// Phase 1 — Public website API controller (no authentication required)

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ── POST /api/v1/public/prayer-request ───────────────────────────────────────

export async function submitPrayerRequest(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, phoneNumber, requestText } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ error: 'ሙሉ ስምዎን ያስገቡ (Full name is required)' });
      return;
    }

    if (!requestText || typeof requestText !== 'string' || requestText.trim().length < 10) {
      res.status(400).json({ error: 'የጸሎት ጥያቄዎን ያስገቡ (Prayer request text is required, min 10 chars)' });
      return;
    }

    const prayer = await prisma.prayerRequest.create({
      data: {
        fullName:    fullName.trim(),
        phoneNumber: phoneNumber?.trim() || null,
        requestText: requestText.trim(),
        status:      'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'ጸሎቱ ደርሷል። ካህናቱ ያዩዎታል።',
      id: prayer.id,
    });
  } catch (err) {
    console.error('[PublicController] submitPrayerRequest error:', err);
    res.status(500).json({ error: 'ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።' });
  }
}

// ── GET /api/v1/public/prayer-request/:id ────────────────────────────────────
// Allows submitter to check their request status by ID

export async function getPrayerRequestStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const prayer = await prisma.prayerRequest.findUnique({
      where: { id },
      select: { id: true, status: true, createdAt: true },
    });

    if (!prayer) {
      res.status(404).json({ error: 'ጥያቄው አልተገኘም' });
      return;
    }

    res.status(200).json(prayer);
  } catch (err) {
    console.error('[PublicController] getPrayerRequestStatus error:', err);
    res.status(500).json({ error: 'ስህተት ተፈጥሯል' });
  }
}

// ── GET /api/v1/public/health ─────────────────────────────────────────────────

export async function publicHealth(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ status: 'ok', service: 'OrthodoxConnect Public API', phase: 1 });
}
