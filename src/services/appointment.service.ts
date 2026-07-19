import prisma from '../lib/prisma';
import { AppointmentStatus, AppointmentType } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../middleware/error-handler.middleware';

const PRIEST_ROLES = ['PATRIARCH', 'ARCHBISHOP', 'METROPOLITAN', 'BISHOP', 'PRIEST'];

export interface BookAppointmentPayload {
  priestId: string;
  appointmentType: AppointmentType;
  requestedDate: string;          // ISO date string
  requestedDateEth?: string;      // Ethiopian date e.g. "10/11/2016"
  followerNote?: string;
}

export interface DecideAppointmentPayload {
  decision: 'APPROVE' | 'REJECT' | 'RESCHEDULE' | 'COMPLETE';
  confirmedDate?: string;
  priestNote?: string;
}

export class AppointmentService {
  /**
   * Follower books a new appointment with their spiritual father (ቀጠሮ).
   */
  async bookAppointment(followerId: string, payload: BookAppointmentPayload) {
    const follower = await prisma.user.findFirst({
      where: { id: followerId, deletedAt: null },
      select: { id: true, fullName: true, institutionId: true, ecclesiasticalRole: true },
    });
    if (!follower) throw new NotFoundError('Follower user not found.');

    // Validate priest exists and is actually a priest
    const priest = await prisma.user.findFirst({
      where: { id: payload.priestId, deletedAt: null },
      select: { id: true, ecclesiasticalRole: true },
    });
    if (!priest) throw new NotFoundError('Spiritual father not found.');
    if (!PRIEST_ROLES.includes(priest.ecclesiasticalRole as string)) {
      throw new ForbiddenError('The selected user is not an ordained priest.');
    }

    const appointment = await prisma.spiritualAppointment.create({
      data: {
        tenantId: follower.institutionId,
        followerId,
        priestId: payload.priestId,
        appointmentType: payload.appointmentType,
        requestedDate: new Date(payload.requestedDate),
        requestedDateEth: payload.requestedDateEth ?? null,
        followerNote: payload.followerNote ?? null,
        status: AppointmentStatus.PENDING,
      },
      include: {
        follower: { select: { id: true, fullName: true, email: true } },
        priest:  { select: { id: true, fullName: true, nameAm: true, nameGez: true } },
      },
    });

    // Record history
    await prisma.appointmentHistory.create({
      data: {
        appointmentId: appointment.id,
        status: AppointmentStatus.PENDING,
        changedById: followerId,
        notes: payload.followerNote ?? null,
      }
    });

    // Create notification for priest
    await prisma.notification.create({
      data: {
        userId: payload.priestId,
        title: 'አዲስ የቀጠሮ ጥያቄ',
        body: `${follower.fullName} አዲስ የቀጠሮ ጥያቄ ልከዋል።`,
      }
    });

    return appointment;
  }

  /**
   * Follower views their own appointments.
   */
  async getFollowerAppointments(followerId: string) {
    return prisma.spiritualAppointment.findMany({
      where: { followerId },
      include: {
        priest: { select: { id: true, fullName: true, nameAm: true, nameGez: true } },
      },
      orderBy: { requestedDate: 'desc' },
    });
  }

  /**
   * Follower gets a specific appointment by ID.
   */
  async getAppointmentById(followerId: string, appointmentId: string) {
    const appt = await prisma.spiritualAppointment.findFirst({
      where: { id: appointmentId, followerId },
      include: {
        priest: { select: { id: true, fullName: true, nameAm: true, nameGez: true } },
        histories: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { fullName: true } },
          },
        },
      },
    });
    if (!appt) throw new NotFoundError('Appointment not found.');
    return appt;
  }

  /**
   * Follower cancels an appointment (if PENDING).
   */
  async cancelAppointment(followerId: string, appointmentId: string) {
    const appointment = await prisma.spiritualAppointment.findFirst({
      where: { id: appointmentId, followerId },
      include: {
        follower: { select: { fullName: true } },
      },
    });

    if (!appointment) throw new NotFoundError('Appointment not found.');
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new ForbiddenError('Only pending appointments can be cancelled.');
    }

    const updated = await prisma.spiritualAppointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
      include: {
        follower: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Record history
    await prisma.appointmentHistory.create({
      data: {
        appointmentId,
        status: AppointmentStatus.CANCELLED,
        changedById: followerId,
        notes: 'በምዕመኑ ተሰርዟል',
      },
    });

    // Create notification for priest
    await prisma.notification.create({
      data: {
        userId: appointment.priestId,
        title: 'ቀጠሮ ተሰርዟል',
        body: `${appointment.follower.fullName} የያዙትን ቀጠሮ ሰርዘዋል።`,
      },
    });

    return updated;
  }

  /**
   * Priest views all appointments assigned to them, optionally filtered by status.
   */
  async getPriestAppointments(priestId: string, status?: AppointmentStatus) {
    return prisma.spiritualAppointment.findMany({
      where: {
        priestId,
        ...(status ? { status } : {}),
      },
      include: {
        follower: { select: { id: true, fullName: true, nameAm: true, email: true, institutionId: true } },
      },
      orderBy: [
        { status: 'asc' },       // PENDING first
        { requestedDate: 'desc' },
      ],
    });
  }

  /**
   * Priest approves, rejects, reschedules, or marks complete.
   */
  async decideAppointment(
    priestId: string,
    appointmentId: string,
    payload: DecideAppointmentPayload,
  ) {
    // Verify the appointment belongs to this priest
    const appointment = await prisma.spiritualAppointment.findFirst({
      where: { id: appointmentId, priestId },
    });
    if (!appointment) throw new NotFoundError('Appointment not found or not assigned to you.');

    const statusMap: Record<string, AppointmentStatus> = {
      APPROVE:    AppointmentStatus.APPROVED,
      REJECT:     AppointmentStatus.REJECTED,
      RESCHEDULE: AppointmentStatus.RESCHEDULED,
      COMPLETE:   AppointmentStatus.COMPLETED,
    };

    const status = statusMap[payload.decision];

    const updated = await prisma.spiritualAppointment.update({
      where: { id: appointmentId },
      data: {
        status,
        confirmedDate: payload.confirmedDate ? new Date(payload.confirmedDate) : undefined,
        priestNote:    payload.priestNote ?? undefined,
      },
      include: {
        follower: { select: { id: true, fullName: true, email: true } },
        priest: { select: { fullName: true } },
      },
    });

    // Record history
    await prisma.appointmentHistory.create({
      data: {
        appointmentId,
        status,
        changedById: priestId,
        notes: payload.priestNote ?? null,
      },
    });

    // Create notification for member
    let title = '';
    let body = '';
    if (status === AppointmentStatus.APPROVED) {
      title = 'ቀጠሮ ተቀባይነት አግኝቷል';
      body = `የንስሐ አባትዎ ${updated.priest.fullName} ቀጠሮዎን አጽድቀዋል።`;
    } else if (status === AppointmentStatus.REJECTED) {
      title = 'ቀጠሮ ውድቅ ተደርጓል';
      body = `የንስሐ አባትዎ ${updated.priest.fullName} ቀጠሮዎን ውድቅ አድርገዋል።`;
    } else if (status === AppointmentStatus.RESCHEDULED) {
      title = 'እንደገና ተይዟል';
      body = `የንስሐ አባትዎ ${updated.priest.fullName} ቀጠሮውን ወደ ሌላ ጊዜ አዛውረዋል።`;
    } else if (status === AppointmentStatus.COMPLETED) {
      title = 'ቀጠሮ ተጠናቋል';
      body = `ቀጠሮዎ በተሳካ ሁኔታ ተጠናቋል።`;
    }

    if (title && body) {
      await prisma.notification.create({
        data: {
          userId: updated.followerId,
          title,
          body,
        },
      });
    }

    return updated;
  }

  /**
   * Priest dashboard stats — quick summary counts by status.
   */
  async getPriestStats(priestId: string) {
    const counts = await prisma.spiritualAppointment.groupBy({
      by: ['status'],
      where: { priestId },
      _count: { id: true },
    });
    const result: Record<string, number> = { PENDING: 0, APPROVED: 0, COMPLETED: 0, REJECTED: 0, RESCHEDULED: 0, CANCELLED: 0 };
    counts.forEach((c) => { result[c.status] = c._count.id; });
    return result;
  }
}

export const appointmentService = new AppointmentService();

