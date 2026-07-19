// src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class NotificationController {
  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(notifications);
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const notif = await prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!notif) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json(updated);
  }
}

export const notificationController = new NotificationController();
