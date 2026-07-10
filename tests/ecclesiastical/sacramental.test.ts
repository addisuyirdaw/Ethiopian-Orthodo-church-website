import request from 'supertest';
import jwt from 'jsonwebtoken';
import { EcclesiasticalRole, CanonicalProfileStatus } from '@prisma/client';
import { JWT_SECRET } from '../../src/middleware/auth.middleware';
import { JwtPayload } from '../../src/types';

jest.setTimeout(60000);

// Mock database interactions
const mockProfileCreate = jest.fn();
const mockProfileFindUnique = jest.fn();
const mockProfileUpdate = jest.fn();
const mockMarriageCreate = jest.fn();
const mockTransaction = jest.fn(
  async (fn: (tx: any) => Promise<unknown>) =>
    fn({
      marriageRegistry: { create: mockMarriageCreate },
      sacramentalProfile: { update: mockProfileUpdate },
    })
);

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    sacramentalProfile: {
      create: mockProfileCreate,
      findUnique: mockProfileFindUnique,
      update: mockProfileUpdate,
    },
    marriageRegistry: {
      create: mockMarriageCreate,
    },
    $transaction: mockTransaction,
  },
}));

import { createApp } from '../../src/app';

const app = createApp();

const PARISH_ID = '550e8400-e29b-41d4-a716-446655440000';
const PRIEST_ID = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';

// Generate token with valid claims matching the institution id
const mockToken = jwt.sign(
  {
    sub: 'user-priest-1',
    institution_id: PARISH_ID,
    hierarchy_path: `/1/3/${PARISH_ID}/`,
    ecclesiastical_role: EcclesiasticalRole.PRIEST,
  } satisfies JwtPayload,
  JWT_SECRET,
  { expiresIn: '24h' }
);

describe('Module 15 — Sacramental Traceability Matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/sacramental/baptism', () => {
    const validBaptismPayload = {
      firstName: 'Girma',
      lastName: 'Abebe',
      firstNameAm: 'ግርማ',
      lastNameAm: 'አበበ',
      christianName: 'Hailemariam',
      baptismDate: '2026-07-10T12:00:00.000Z',
      baptizingPriestId: PRIEST_ID,
      parishId: PARISH_ID,
      institutionId: PARISH_ID, // matches user.institutionId to satisfy tenantRbac
    };

    it('successfully registers baptism and generates a deterministic ID', async () => {
      mockProfileCreate.mockResolvedValueOnce({
        id: 'profile-uuid-1',
        sacramentalId: 'OC-REG-2026-A1B2C3D4',
        ...validBaptismPayload,
        canonicalStatus: CanonicalProfileStatus.SINGLE,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/sacramental/baptism')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validBaptismPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sacramentalId).toMatch(/^OC-REG-\d{4}-[A-F0-9]{8}$/);
      expect(mockProfileCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'Girma',
            lastName: 'Abebe',
            christianName: 'Hailemariam',
            canonicalStatus: CanonicalProfileStatus.SINGLE,
          }),
        })
      );
    });

    it('returns 400 Bad Request if validation fails', async () => {
      const invalidPayload = {
        firstName: '', // empty name
        parishId: 'invalid-uuid',
      };

      const res = await request(app)
        .post('/api/v1/sacramental/baptism')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });
  });

  describe('POST /api/v1/sacramental/marriage/verify-and-register', () => {
    const groomId = 'OC-REG-2026-11111111';
    const brideId = 'OC-REG-2026-22222222';

    const validMarriagePayload = {
      husbandSacramentalId: groomId,
      wifeSacramentalId: brideId,
      marriageDate: '2026-07-10T14:00:00.000Z',
      officiatingPriestId: PRIEST_ID,
      parishId: PARISH_ID,
      witnessNames: ['Witness One', 'Witness Two'],
      institutionId: PARISH_ID, // matches user.institutionId to satisfy tenantRbac
    };

    it('successfully registers marriage and updates both profiles to MARRIED status', async () => {
      // Mock both parties exist and are SINGLE
      mockProfileFindUnique
        .mockResolvedValueOnce({
          id: 'husband-uuid',
          sacramentalId: groomId,
          canonicalStatus: CanonicalProfileStatus.SINGLE,
        })
        .mockResolvedValueOnce({
          id: 'wife-uuid',
          sacramentalId: brideId,
          canonicalStatus: CanonicalProfileStatus.SINGLE,
        });

      mockMarriageCreate.mockResolvedValueOnce({
        id: 'marriage-uuid',
        husbandProfileId: 'husband-uuid',
        wifeProfileId: 'wife-uuid',
        marriageDate: new Date(validMarriagePayload.marriageDate),
        officiatingPriestId: PRIEST_ID,
        parishId: PARISH_ID,
        witnessNames: validMarriagePayload.witnessNames,
        husbandProfile: { id: 'husband-uuid', canonicalStatus: CanonicalProfileStatus.MARRIED },
        wifeProfile: { id: 'wife-uuid', canonicalStatus: CanonicalProfileStatus.MARRIED },
      });

      const res = await request(app)
        .post('/api/v1/sacramental/marriage/verify-and-register')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validMarriagePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.husbandProfileId).toBe('husband-uuid');
      expect(res.body.data.wifeProfileId).toBe('wife-uuid');

      // Verify transaction update calls were made for both profiles
      expect(mockProfileUpdate).toHaveBeenCalledTimes(2);
      expect(mockProfileUpdate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { id: 'husband-uuid' },
          data: { canonicalStatus: CanonicalProfileStatus.MARRIED },
        })
      );
      expect(mockProfileUpdate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { id: 'wife-uuid' },
          data: { canonicalStatus: CanonicalProfileStatus.MARRIED },
        })
      );
    });

    it('prevents marriage if the husband profile status is MARRIED', async () => {
      // Mock groom is MARRIED, bride is SINGLE
      mockProfileFindUnique
        .mockResolvedValueOnce({
          id: 'husband-uuid',
          sacramentalId: groomId,
          canonicalStatus: CanonicalProfileStatus.MARRIED,
        })
        .mockResolvedValueOnce({
          id: 'wife-uuid',
          sacramentalId: brideId,
          canonicalStatus: CanonicalProfileStatus.SINGLE,
        });

      const res = await request(app)
        .post('/api/v1/sacramental/marriage/verify-and-register')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validMarriagePayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('CanonicalError');
      expect(res.body.message).toContain('Canonical barrier detected');
      expect(mockMarriageCreate).not.toHaveBeenCalled();
    });

    it('prevents marriage if the wife profile status is MONASTIC', async () => {
      // Mock groom is SINGLE, bride is MONASTIC
      mockProfileFindUnique
        .mockResolvedValueOnce({
          id: 'husband-uuid',
          sacramentalId: groomId,
          canonicalStatus: CanonicalProfileStatus.SINGLE,
        })
        .mockResolvedValueOnce({
          id: 'wife-uuid',
          sacramentalId: brideId,
          canonicalStatus: CanonicalProfileStatus.MONASTIC,
        });

      const res = await request(app)
        .post('/api/v1/sacramental/marriage/verify-and-register')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validMarriagePayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('CanonicalError');
      expect(res.body.message).toContain('Canonical barrier detected');
      expect(mockMarriageCreate).not.toHaveBeenCalled();
    });

    it('returns 404 if either party profile is not found', async () => {
      mockProfileFindUnique
        .mockResolvedValueOnce({
          id: 'husband-uuid',
          sacramentalId: groomId,
          canonicalStatus: CanonicalProfileStatus.SINGLE,
        })
        .mockResolvedValueOnce(null); // wife not found

      const res = await request(app)
        .post('/api/v1/sacramental/marriage/verify-and-register')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validMarriagePayload);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NotFound');
    });
  });
});
