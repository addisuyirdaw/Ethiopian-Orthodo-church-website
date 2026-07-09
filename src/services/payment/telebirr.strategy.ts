import { PaymentGateway } from '@prisma/client';
import {
  IPaymentGatewayStrategy,
  PaymentInitiationResult,
} from './types';

export class TelebirrStrategy implements IPaymentGatewayStrategy {
  async initiatePayment(
    amount: number,
    currency: string,
    referenceId: string,
  ): Promise<PaymentInitiationResult> {
    return {
      gatewayUrl: `https://pay.telebirr.et/checkout?ref=${referenceId}&amount=${amount}&currency=${currency}`,
      rawResponse: {
        provider: PaymentGateway.TELEBIRR,
        status: 'INITIATED',
        referenceId,
        amount,
        currency,
      },
    };
  }
}

export const telebirrStrategy = new TelebirrStrategy();
