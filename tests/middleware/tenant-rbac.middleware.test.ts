import { Request, Response, NextFunction } from 'express';
import { EcclesiasticalRole } from '@prisma/client';
import {
  canAccessInstitution,
  tenantRbac,
  FORBIDDEN_RESPONSE,
} from '../../src/middleware/tenant-rbac.middleware';
import { institutionRepository } from '../../src/repositories/institution.repository';
import { AuthenticatedUser } from '../../src/types';

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findById: jest.fn(),
  },
}));

const mockFindById = institutionRepository.findById as jest.Mock;

function createMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    institutionId: 'inst-diocese-1',
    hierarchyPath: '/1/3/',
    ecclesiasticalRole: EcclesiasticalRole.BISHOP,
    ...overrides,
  };
}

function createMockReqRes(user?: AuthenticatedUser, query: Record<string, string> = {}) {
  const req = {
    user,
    query,
    body: {},
    params: {},
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, next };
}

describe('canAccessInstitution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows access to the user own institution', async () => {
    const user = createMockUser();
    const result = await canAccessInstitution(user, 'inst-diocese-1');
    expect(result).toBe(true);
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it('denies write access to a different institution when requireSameInstitution is true', async () => {
    const user = createMockUser({ ecclesiasticalRole: EcclesiasticalRole.BISHOP });
    const result = await canAccessInstitution(user, 'inst-parish-5', true);
    expect(result).toBe(false);
  });

  it('allows bishops to read downstream institutions via hierarchy_path prefix', async () => {
    const user = createMockUser({ ecclesiasticalRole: EcclesiasticalRole.BISHOP });
    mockFindById.mockResolvedValue({
      id: 'inst-parish-5',
      hierarchyPath: '/1/3/12/',
      deletedAt: null,
    });

    const result = await canAccessInstitution(user, 'inst-parish-5', false);
    expect(result).toBe(true);
    expect(mockFindById).toHaveBeenCalledWith('inst-parish-5');
  });

  it('denies access when target institution is outside canonical jurisdiction', async () => {
    const user = createMockUser({ ecclesiasticalRole: EcclesiasticalRole.BISHOP });
    mockFindById.mockResolvedValue({
      id: 'inst-other-diocese',
      hierarchyPath: '/1/99/',
      deletedAt: null,
    });

    const result = await canAccessInstitution(user, 'inst-other-diocese', false);
    expect(result).toBe(false);
  });

  it('denies parish priests from reading sibling parish records', async () => {
    const user = createMockUser({
      ecclesiasticalRole: EcclesiasticalRole.PRIEST,
      institutionId: 'inst-parish-12',
      hierarchyPath: '/1/3/12/',
    });
    mockFindById.mockResolvedValue({
      id: 'inst-parish-13',
      hierarchyPath: '/1/3/13/',
      deletedAt: null,
    });

    const result = await canAccessInstitution(user, 'inst-parish-13', false);
    expect(result).toBe(false);
  });

  it('denies access when target institution is soft-deleted', async () => {
    const user = createMockUser({ ecclesiasticalRole: EcclesiasticalRole.METROPOLITAN });
    mockFindById.mockResolvedValue({
      id: 'inst-parish-5',
      hierarchyPath: '/1/3/12/',
      deletedAt: new Date(),
    });

    const result = await canAccessInstitution(user, 'inst-parish-5', false);
    expect(result).toBe(false);
  });
});

describe('tenantRbac middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const { req, res, next } = createMockReqRes(undefined);
    const middleware = tenantRbac();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 with canonical jurisdiction message on violation', async () => {
    const user = createMockUser({ ecclesiasticalRole: EcclesiasticalRole.PRIEST });
    const { req, res, next } = createMockReqRes(user, { institution_id: 'inst-parish-99' });

    mockFindById.mockResolvedValue({
      id: 'inst-parish-99',
      hierarchyPath: '/1/99/55/',
      deletedAt: null,
    });

    const middleware = tenantRbac();
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(FORBIDDEN_RESPONSE);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets resolvedInstitutionId when access is granted', async () => {
    const user = createMockUser();
    const { req, res, next } = createMockReqRes(user);

    const middleware = tenantRbac();
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.resolvedInstitutionId).toBe('inst-diocese-1');
  });
});

describe('hierarchy path utilities', () => {
  it('correctly identifies downstream paths', () => {
    const { isSameOrDownstreamInstitution, isAdministrativeRole } = require('../../src/types');

    expect(isSameOrDownstreamInstitution('/1/3/', '/1/3/12/')).toBe(true);
    expect(isSameOrDownstreamInstitution('/1/3/', '/1/99/')).toBe(false);
    expect(isAdministrativeRole(EcclesiasticalRole.BISHOP)).toBe(true);
    expect(isAdministrativeRole(EcclesiasticalRole.PRIEST)).toBe(false);
  });
});
