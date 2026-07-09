import { PaymentGateway } from '@prisma/client';
import {
  IPaymentGatewayStrategy,
  PaymentInitiationResult,
} from './types';

export class CbeBirrStrategy implements IPaymentGatewayStrategy {
  async initiatePayment(
    amount: number,
    currency: string,
    referenceId: string,
  ): Promise<PaymentInitiationResult> {
    return {
      gatewayUrl: `https://pay.cbebirr.com/v1/redirect?reference=${referenceId}&amt=${amount}&cur=${currency}`,
      rawResponse: {
        provider: PaymentGateway.CBE_BIRR,
        status: 'INITIATED',
        referenceId,
        amount,
        currency,
      },
    };
  }
}

export const cbeBirrStrategy = new CbeBirrStrategy();
