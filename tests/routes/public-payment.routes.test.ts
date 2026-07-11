import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../../src/app';
import { initiatePublicDonation, settlePublicDonationWebhook } from '../../src/services/public-donation.service';
import { institutionRepository } from '../../src/repositories/institution.repository';

jest.mock('../../src/services/public-donation.service', () => ({
  initiatePublicDonation: jest.fn(),
  settlePublicDonationWebhook: jest.fn(),
}));

jest.mock('../../src/repositories/institution.repository', () => ({
  institutionRepository: {
    findAll: jest.fn(),
  },
}));

const mockInitiatePublicDonation = initiatePublicDonation as jest.Mock;
const mockSettlePublicDonationWebhook = settlePublicDonationWebhook as jest.Mock;
const mockFindAllInstitutions = institutionRepository.findAll as jest.Mock;

describe('Public Payment / Donation Routes', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/public/donate', () => {
    const payload = {
      amount: 150.50,
      currency: 'ETB',
      donorName: 'Abebe Bikila',
      donorPhone: '+251911223344',
      targetTenantId: '550e8400-e29b-41d4-a716-446655440000',
      contributionType: 'GENERAL',
      gateway: 'CHAPA',
    };

    it('returns 201 and redirect details on successful initiation', async () => {
      mockInitiatePublicDonation.mockResolvedValue({
        txnReference: 'OC-TXN-12345',
        gatewayUrl: 'https://checkout.chapa.co/12345',
        institution: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Bole Medhanealem',
        },
        splits: [],
      });

      const res = await request(app)
        .post('/api/v1/public/donate')
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.txnReference).toBe('OC-TXN-12345');
      expect(res.body.data.gatewayUrl).toBe('https://checkout.chapa.co/12345');
      expect(res.body.data.institutionName).toBe('Bole Medhanealem');
      expect(mockInitiatePublicDonation).toHaveBeenCalledWith(payload);
    });

    it('returns 400 when validation fails', async () => {
      const badPayload = { ...payload, amount: -10 }; // invalid positive number

      await request(app)
        .post('/api/v1/public/donate')
        .send(badPayload)
        .expect(400);

      expect(mockInitiatePublicDonation).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/public/payment-webhook', () => {
    const payload = {
      txnReference: 'OC-TXN-12345',
      status: 'SUCCESS',
      amount: 150.50,
    };
    const secret = process.env.DONATION_WEBHOOK_SECRET || 'development-donation-webhook-secret';

    function computeSignature(body: string): string {
      return crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    }

    it('returns 401 when signature header is missing', async () => {
      await request(app)
        .post('/api/v1/public/payment-webhook')
        .send(payload)
        .expect(401);
    });

    it('returns 401 when signature is invalid', async () => {
      await request(app)
        .post('/api/v1/public/payment-webhook')
        .set('x-signature', 'invalid-signature')
        .send(payload)
        .expect(401);
    });

    it('returns 200 and performs split verification on valid webhook signature', async () => {
      const rawBodyString = JSON.stringify(payload);
      const signature = computeSignature(rawBodyString);

      mockSettlePublicDonationWebhook.mockResolvedValue({
        txnId: 'txn-123',
        txnReference: 'OC-TXN-12345',
        status: 'COMPLETED',
        parishShare: '135.4500',
        patriarchateShare: '15.0500',
      });

      const res = await request(app)
        .post('/api/v1/public/payment-webhook')
        .set('x-signature', signature)
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.txnReference).toBe('OC-TXN-12345');
      expect(res.body.data.finalStatus).toBe('COMPLETED');
      expect(res.body.data.canonicalSplit.parishAllocation.amount).toBe('135.4500');
      expect(res.body.data.canonicalSplit.holySynodAllocation.amount).toBe('15.0500');
      expect(mockSettlePublicDonationWebhook).toHaveBeenCalledWith('OC-TXN-12345', 'SUCCESS');
    });
  });

  describe('GET /api/v1/public/tenants', () => {
    it('returns 200 with list of active parishes and monasteries only', async () => {
      const mockList = [
        { id: 'inst-1', name: 'Bole Medhanealem', type: 'PARISH' },
        { id: 'inst-2', name: 'Debre Libanos', type: 'MONASTERY' },
        { id: 'inst-3', name: 'Patriarchate Apex', type: 'PATRIARCHATE' }, // Should be filtered out
      ];
      mockFindAllInstitutions.mockResolvedValue(mockList);

      const res = await request(app)
        .get('/api/v1/public/tenants')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].id).toBe('inst-1');
      expect(res.body.data[1].id).toBe('inst-2');
      expect(res.body.data.some((inst: any) => inst.type === 'PATRIARCHATE')).toBe(false);
      expect(mockFindAllInstitutions).toHaveBeenCalled();
    });
  });
});
