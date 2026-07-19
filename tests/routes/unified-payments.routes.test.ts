import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { EcclesiasticalRole, PaymentProvider } from '@prisma/client';
import { createApp } from '../../src/app';
import { unifiedPaymentsService } from '../../src/services/unified-payments.service';
import { JWT_SECRET } from '../../src/middleware/auth.middleware';
import { JwtPayload } from '../../src/types';

jest.mock('../../src/services/unified-payments.service', () => ({
  unifiedPaymentsService: {
    configureMerchant: jest.fn(),
    getMerchantConfig: jest.fn(),
    initiatePayment: jest.fn(),
    settleWebhook: jest.fn(),
    getTransactionHistory: jest.fn(),
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

const mockConfigureMerchant = unifiedPaymentsService.configureMerchant as jest.Mock;
const mockGetMerchantConfig = unifiedPaymentsService.getMerchantConfig as jest.Mock;
const mockInitiatePayment = unifiedPaymentsService.initiatePayment as jest.Mock;
const mockSettleWebhook = unifiedPaymentsService.settleWebhook as jest.Mock;
const mockGetTransactionHistory = unifiedPaymentsService.getTransactionHistory as jest.Mock;

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

describe('Unified Payments Routes', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/fintech/unified/merchant-config', () => {
    const payload = {
      institutionId: PARISH_ID,
      provider: PaymentProvider.TELEBIRR,
      isActive: true,
      configPayload: { appId: '123', appKey: 'secret' },
    };

    it('returns 401 when Authorization header is missing', async () => {
      await request(app)
        .post('/api/v1/fintech/unified/merchant-config')
        .send(payload)
        .expect(401);
    });

    it('returns 200 and config on successful update', async () => {
      const mockResult = { id: 'config-1', ...payload };
      mockConfigureMerchant.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/v1/fintech/unified/merchant-config')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(mockConfigureMerchant).toHaveBeenCalledWith(PARISH_ID, expect.objectContaining({
        institutionId: PARISH_ID,
        provider: payload.provider,
        isActive: payload.isActive,
      }));
    });

    it('returns 400 when validation fails', async () => {
      const badPayload = { provider: 'INVALID_PROVIDER', isActive: true, configPayload: {} };

      await request(app)
        .post('/api/v1/fintech/unified/merchant-config')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(badPayload)
        .expect(400);

      expect(mockConfigureMerchant).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/fintech/unified/merchant-config/:institutionId', () => {
    it('returns 200 with config', async () => {
      const mockResult = { id: 'config-1', institutionId: PARISH_ID, provider: PaymentProvider.TELEBIRR };
      mockGetMerchantConfig.mockResolvedValue(mockResult);

      const res = await request(app)
        .get(`/api/v1/fintech/unified/merchant-config/${PARISH_ID}`)
        .set('Authorization', `Bearer ${priestToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(mockGetMerchantConfig).toHaveBeenCalledWith(PARISH_ID);
    });
  });

  describe('POST /api/v1/fintech/unified/transactions/initiate', () => {
    const payload = {
      institutionId: PARISH_ID,
      amount: 150.50,
      currency: 'ETB',
      provider: PaymentProvider.TELEBIRR,
    };

    it('returns 201 and transaction details', async () => {
      const mockResult = {
        transactionId: 'txn-123',
        providerRef: 'UP-TXN-12345',
        gatewayUrl: 'https://telebirr.example.com/pay',
      };
      mockInitiatePayment.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/v1/fintech/unified/transactions/initiate')
        .set('Authorization', `Bearer ${priestToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(mockInitiatePayment).toHaveBeenCalledWith(`user-priest`, PARISH_ID, expect.objectContaining({
        institutionId: PARISH_ID,
        amount: payload.amount,
        currency: payload.currency,
        provider: payload.provider,
      }));
    });
  });

  describe('GET /api/v1/fintech/unified/transactions/history/:institutionId', () => {
    it('returns 200 and history list', async () => {
      const mockHistory = [{ id: 'txn-1', amount: 150 }];
      mockGetTransactionHistory.mockResolvedValue(mockHistory);

      const res = await request(app)
        .get(`/api/v1/fintech/unified/transactions/history/${PARISH_ID}`)
        .set('Authorization', `Bearer ${priestToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockHistory);
      expect(mockGetTransactionHistory).toHaveBeenCalledWith(PARISH_ID);
    });
  });

  describe('POST /api/v1/fintech/unified/webhook/:provider', () => {
    const payload = {
      txnReference: 'UP-TXN-12345',
      status: 'SUCCESS',
    };

    const secret =
      process.env.UNIFIED_PAYMENTS_WEBHOOK_SECRET ??
      process.env.DONATION_WEBHOOK_SECRET ??
      'development-donation-webhook-secret';

    function computeSignature(body: string): string {
      return crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    }

    it('returns 200 and webhook settlement info', async () => {
      mockSettleWebhook.mockResolvedValue({ id: 'txn-123', providerRef: 'UP-TXN-12345', status: 'SUCCESSFUL' });

      const rawBodyString = JSON.stringify(payload);
      const signature = computeSignature(rawBodyString);

      const res = await request(app)
        .post(`/api/v1/fintech/unified/webhook/telebirr`)
        .set('x-signature', signature)
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUCCESSFUL');
      expect(mockSettleWebhook).toHaveBeenCalledWith('UP-TXN-12345', 'SUCCESS');
    });
  });
});
