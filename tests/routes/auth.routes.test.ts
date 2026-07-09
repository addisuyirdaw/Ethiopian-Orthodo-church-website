import request from 'supertest';
import jwt from 'jsonwebtoken';
import { EcclesiasticalRole } from '@prisma/client';
import createApp from '../../src/app';
import { authService } from '../../src/services/auth.service';
import { JWT_SECRET } from '../../src/middleware/auth.middleware';
import { JwtPayload } from '../../src/types';

jest.mock('../../src/services/auth.service', () => ({
  authService: {
    login: jest.fn(),
  },
}));

const mockLogin = authService.login as jest.Mock;

describe('POST /api/v1/auth/login', () => {
  const app = createApp();

  const mockLoginResult = {
    token: jwt.sign(
      {
        sub: 'user-patriarch-1',
        institution_id: 'inst-patriarchate-1',
        hierarchy_path: '/inst-patriarchate-1/',
        ecclesiastical_role: EcclesiasticalRole.PATRIARCH,
      } satisfies JwtPayload,
      JWT_SECRET,
      { expiresIn: '24h' },
    ),
    user: {
      id: 'user-patriarch-1',
      email: 'patriarch@orthodoxconnect.org',
      ecclesiastical_role: EcclesiasticalRole.PATRIARCH,
      institution_id: 'inst-patriarchate-1',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with a JWT containing the four required institutional claims', async () => {
    mockLogin.mockResolvedValue(mockLoginResult);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'patriarch@orthodoxconnect.org',
        password: 'orthodox123',
      })
      .expect(200);

    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user).toEqual(mockLoginResult.user);

    const decoded = jwt.verify(response.body.data.token, JWT_SECRET) as JwtPayload;

    expect(decoded.sub).toBe('user-patriarch-1');
    expect(decoded.institution_id).toBe('inst-patriarchate-1');
    expect(decoded.hierarchy_path).toBe('/inst-patriarchate-1/');
    expect(decoded.ecclesiastical_role).toBe(EcclesiasticalRole.PATRIARCH);

    expect(mockLogin).toHaveBeenCalledWith(
      'patriarch@orthodoxconnect.org',
      'orthodox123',
    );
  });

  it('returns 401 for invalid credentials without exposing internal details', async () => {
    const { UnauthorizedError } = await import('../../src/middleware/error-handler.middleware');
    mockLogin.mockRejectedValue(new UnauthorizedError());

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'patriarch@orthodoxconnect.org',
        password: 'wrong-password',
      })
      .expect(401);

    expect(response.body).toEqual({
      error: 'Unauthorized',
      message: 'Invalid email or password.',
    });
    expect(response.body.token).toBeUndefined();
  });

  it('returns 400 when request body fails validation', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'not-an-email',
        password: '123',
      })
      .expect(400);

    expect(response.body.error).toBe('ValidationError');
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
