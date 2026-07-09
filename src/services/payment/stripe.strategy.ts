import { PaymentGateway } from '@prisma/client';
import {
  IPaymentGatewayStrategy,
  PaymentInitiationResult,
} from './types';

export class StripeStrategy implements IPaymentGatewayStrategy {
  async initiatePayment(
    amount: number,
    currency: string,
    referenceId: string,
  ): Promise<PaymentInitiationResult> {
    return {
      gatewayUrl: `https://checkout.stripe.com/pay/${referenceId}?amount=${amount}&currency=${currency.toLowerCase()}`,
      rawResponse: {
        provider: PaymentGateway.STRIPE,
        status: 'INITIATED',
        referenceId,
        amount,
        currency,
      },
    };
  }
}

export const stripeStrategy = new StripeStrategy();
