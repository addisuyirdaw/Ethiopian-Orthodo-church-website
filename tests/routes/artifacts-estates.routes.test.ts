import request from 'supertest';
import jwt from 'jsonwebtoken';
import { EcclesiasticalRole, ArtifactCategory, StructuralCondition } from '@prisma/client';
import { createApp } from '../../src/app';
import { artifactService } from '../../src/services/logistics/artifact.service';
import { estateService } from '../../src/services/logistics/estate.service';
import { JWT_SECRET } from '../../src/middleware/auth.middleware';
import { JwtPayload } from '../../src/types';

jest.mock('../../src/services/logistics/artifact.service', () => ({
  artifactService: {
    registerArtifact: jest.fn(),
    listArtifacts: jest.fn(),
    logInspection: jest.fn(),
  },
}));

jest.mock('../../src/services/logistics/estate.service', () => ({
  estateService: {
    registerEstate: jest.fn(),
    listEstates: jest.fn(),
  },
}));

const PARISH_ID = '550e8400-e29b-41d4-a716-446655440000';

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        calendarTradition: 'ETHIOPIAN_TEWAHEDO',
        hierarchyPath: `/${id}`,
        deletedAt: null,
      }),
    ),
  },
}));

const mockRegisterArtifact = artifactService.registerArtifact as jest.Mock;
const mockListArtifacts = artifactService.listArtifacts as jest.Mock;
const mockLogInspection = artifactService.logInspection as jest.Mock;
const mockRegisterEstate = estateService.registerEstate as jest.Mock;
const mockListEstates = estateService.listEstates as jest.Mock;

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
const deaconToken = makeToken(EcclesiasticalRole.DEACON);
const bishopToken = makeToken(EcclesiasticalRole.BISHOP);

describe('Artifacts & Estates Routes', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/logistics/artifacts', () => {
    const payload = {
      nameEn: 'Holy Grail',
      nameAm: 'ቅዱስ ጽዋ',
      nameGez: 'ቅዱስ ጽዋዕ',
      category: ArtifactCategory.LITURGICAL_VESSEL,
      structuralCondition: StructuralCondition.GOOD,
      estimatedAge: 500,
      storageLocation: 'Altar Vault',
    };

    it('returns 401 when Authorization header is missing', async () => {
      await request(app)
        .post('/api/v1/logistics/artifacts')
        .send(payload)
        .expect(401);
    });

    it('returns 403 Forbidden for non-clergy roles (Deacon)', async () => {
      await request(app)
        .post('/api/v1/logistics/artifacts')
        .set('Authorization', `Bearer ${deaconToken}`)
        .send(payload)
        .expect(403);
    });

    it('returns 201 and creates artifact for priest role', async () => {
      const createdArtifact = { id: 'art-123', ...payload };
      mockRegisterArtifact.mockResolvedValue(createdArtifact);

      const res = await request(app)
        .post('/api/v1/logistics/artifacts')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.data).toEqual(createdArtifact);
      expect(mockRegisterArtifact).toHaveBeenCalled();
    });

    it('returns 400 when validator rejects body', async () => {
      const badPayload = { ...payload, nameEn: '' }; // nameEn must be at least 2 chars

      await request(app)
        .post('/api/v1/logistics/artifacts')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(badPayload)
        .expect(400);

      expect(mockRegisterArtifact).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/logistics/artifacts', () => {
    it('returns 200 with list of artifacts scoped to user institution', async () => {
      const list = [{ id: 'art-1', nameEn: 'Grail' }];
      mockListArtifacts.mockResolvedValue(list);

      const res = await request(app)
        .get('/api/v1/logistics/artifacts')
        .set('Authorization', `Bearer ${priestToken}`)
        .expect(200);

      expect(res.body.data).toEqual(list);
      expect(mockListArtifacts).toHaveBeenCalledWith(PARISH_ID);
    });
  });

  describe('POST /api/v1/logistics/artifacts/:id/inspect', () => {
    const inspectionPayload = {
      conditionAtInspection: StructuralCondition.NEEDS_RESTORATION,
      inspectionNotes: 'Water damage detected.',
      inspectedAt: new Date().toISOString(),
    };

    it('returns 403 Forbidden for non-clergy (Deacon)', async () => {
      await request(app)
        .post('/api/v1/logistics/artifacts/art-123/inspect')
        .set('Authorization', `Bearer ${deaconToken}`)
        .send(inspectionPayload)
        .expect(403);
    });

    it('returns 201 and logs inspection for priest', async () => {
      const result = { id: 'inspect-1', artifactId: 'art-123' };
      mockLogInspection.mockResolvedValue(result);

      const res = await request(app)
        .post('/api/v1/logistics/artifacts/art-123/inspect')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(inspectionPayload)
        .expect(201);

      expect(res.body.data).toEqual(result);
      expect(mockLogInspection).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/logistics/estates', () => {
    const payload = {
      estateName: 'St. Teklehaimanot Land',
      landAreaHectares: 25.4,
      gpsLatitude: 9.03,
      gpsLongitude: 38.74,
      legalDeedStatus: 'Registered Title Deed',
      currentUtilization: 'Monastery cells and church forestry',
    };

    it('returns 403 Forbidden for non-episcopal roles (Priest)', async () => {
      await request(app)
        .post('/api/v1/logistics/estates')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(payload)
        .expect(403);
    });

    it('returns 201 and creates estate for bishop role', async () => {
      const createdEstate = { id: 'est-999', ...payload };
      mockRegisterEstate.mockResolvedValue(createdEstate);

      const res = await request(app)
        .post('/api/v1/logistics/estates')
        .set('Authorization', `Bearer ${bishopToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.data).toEqual(createdEstate);
      expect(mockRegisterEstate).toHaveBeenCalled();
    });

    it('returns 400 on validation error (negative land area)', async () => {
      const badPayload = { ...payload, landAreaHectares: -5.0 };

      await request(app)
        .post('/api/v1/logistics/estates')
        .set('Authorization', `Bearer ${bishopToken}`)
        .send(badPayload)
        .expect(400);

      expect(mockRegisterEstate).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/logistics/estates', () => {
    it('returns 200 with estates list', async () => {
      const list = [{ id: 'est-1', estateName: 'St. Teklehaimanot Land' }];
      mockListEstates.mockResolvedValue(list);

      const res = await request(app)
        .get('/api/v1/logistics/estates')
        .set('Authorization', `Bearer ${priestToken}`)
        .expect(200);

      expect(res.body.data).toEqual(list);
      expect(mockListEstates).toHaveBeenCalledWith(PARISH_ID);
    });
  });
});
