import request from 'supertest';
import jwt from 'jsonwebtoken';
import { EcclesiasticalRole, CouncilRole } from '@prisma/client';
import { createApp } from '../../src/app';
import { kaleAwadiService } from '../../src/services/kale-awadi.service';
import { JWT_SECRET } from '../../src/middleware/auth.middleware';
import { JwtPayload } from '../../src/types';

jest.mock('../../src/services/kale-awadi.service', () => ({
  kaleAwadiService: {
    assignSeat: jest.fn(),
    deactivateSeat: jest.fn(),
    getActiveSeats: jest.fn(),
    recordMinutes: jest.fn(),
    getMinutes: jest.fn(),
  },
}));

const PARISH_ID = '550e8400-e29b-41d4-a716-446655440000';

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        hierarchyPath: `/${id}`,
        deletedAt: null,
      }),
    ),
  },
}));

const mockAssignSeat = kaleAwadiService.assignSeat as jest.Mock;
const mockDeactivateSeat = kaleAwadiService.deactivateSeat as jest.Mock;
const mockGetActiveSeats = kaleAwadiService.getActiveSeats as jest.Mock;
const mockRecordMinutes = kaleAwadiService.recordMinutes as jest.Mock;
const mockGetMinutes = kaleAwadiService.getMinutes as jest.Mock;

function makeToken(role: EcclesiasticalRole, institutionId = PARISH_ID): string {
  return jwt.sign(
    {
      sub: `user-${role.toLowerCase()}`,
      institution_id: institutionId,
      hierarchy_path: `/${institutionId}`,
      ecclesiastical_role: role,
    } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

const priestToken = makeToken(EcclesiasticalRole.PRIEST);

describe('Kale Awadi Governance Routes', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/governance/sebeka-gubae/seats', () => {
    const payload = {
      institutionId: PARISH_ID,
      userId: '660e8400-e29b-41d4-a716-446655441111',
      role: CouncilRole.LIQE_MENBER,
      termStart: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      termEnd: new Date('2027-01-01T00:00:00.000Z').toISOString(),
      isActive: true,
    };

    it('returns 401 when Authorization header is missing', async () => {
      await request(app)
        .post('/api/v1/governance/sebeka-gubae/seats')
        .send(payload)
        .expect(401);
    });

    it('returns 201 and seat info on successful assignment', async () => {
      const mockResult = { id: 'seat-123', ...payload };
      mockAssignSeat.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/v1/governance/sebeka-gubae/seats')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('seat-123');
      // The controller converts date strings to Dates during validator coerce, so the call gets Date objects
      expect(mockAssignSeat).toHaveBeenCalledWith(PARISH_ID, expect.objectContaining({
        userId: payload.userId,
        role: payload.role,
        isActive: payload.isActive,
      }));
    });

    it('returns 400 when validation fails (termEnd before termStart)', async () => {
      const badPayload = {
        ...payload,
        termStart: new Date('2027-01-01T00:00:00.000Z').toISOString(),
        termEnd: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      };

      await request(app)
        .post('/api/v1/governance/sebeka-gubae/seats')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(badPayload)
        .expect(400);

      expect(mockAssignSeat).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/governance/sebeka-gubae/seats/:institutionId', () => {
    it('returns 200 with active seats list', async () => {
      const mockList = [{ id: 'seat-1', role: CouncilRole.LIQE_MENBER }];
      mockGetActiveSeats.mockResolvedValue(mockList);

      const res = await request(app)
        .get(`/api/v1/governance/sebeka-gubae/seats/${PARISH_ID}`)
        .set('Authorization', `Bearer ${priestToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockList);
      expect(mockGetActiveSeats).toHaveBeenCalledWith(PARISH_ID);
    });
  });

  describe('DELETE /api/v1/governance/sebeka-gubae/seats/:seatId', () => {
    it('returns 200 with deactivated seat info', async () => {
      const mockSeat = { id: 'seat-123', isActive: false };
      mockDeactivateSeat.mockResolvedValue(mockSeat);

      const res = await request(app)
        .delete('/api/v1/governance/sebeka-gubae/seats/seat-123')
        .set('Authorization', `Bearer ${priestToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('seat-123');
      expect(res.body.data.isActive).toBe(false);
      expect(mockDeactivateSeat).toHaveBeenCalledWith('seat-123', expect.objectContaining({ id: 'user-priest' }));
    });
  });

  describe('POST /api/v1/governance/qale-gubae/minutes', () => {
    const payload = {
      institutionId: PARISH_ID,
      minuteNumber: 'MN-001',
      meetingDate: new Date('2026-07-10T10:00:00.000Z').toISOString(),
      discussionTopic: 'Finance & Parish Ledger Auditing',
      resolutionsPassed: 'Agreed to initiate payments system rollout.',
    };

    it('returns 201 and minute entry on successful save', async () => {
      const mockResult = { id: 'min-123', ...payload, signatureHash: 'hash123' };
      mockRecordMinutes.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/v1/governance/qale-gubae/minutes')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('min-123');
      expect(mockRecordMinutes).toHaveBeenCalledWith(
        'user-priest',
        PARISH_ID,
        expect.objectContaining({
          minuteNumber: payload.minuteNumber,
          discussionTopic: payload.discussionTopic,
          resolutionsPassed: payload.resolutionsPassed,
        })
      );
    });
  });

  describe('GET /api/v1/governance/qale-gubae/minutes/:institutionId', () => {
    it('returns 200 with minutes ledger', async () => {
      const mockList = [{ id: 'min-1', minuteNumber: 'MN-001' }];
      mockGetMinutes.mockResolvedValue(mockList);

      const res = await request(app)
        .get(`/api/v1/governance/qale-gubae/minutes/${PARISH_ID}`)
        .set('Authorization', `Bearer ${priestToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockList);
      expect(mockGetMinutes).toHaveBeenCalledWith(PARISH_ID);
    });
  });
});
