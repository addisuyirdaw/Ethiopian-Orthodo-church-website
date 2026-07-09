import { PaymentGateway } from '@prisma/client';
import { IPaymentGatewayStrategy } from './types';
import { telebirrStrategy } from './telebirr.strategy';
import { cbeBirrStrategy } from './cbe-birr.strategy';
import { stripeStrategy } from './stripe.strategy';

export class PaymentGatewayFactory {
  resolveByCurrency(currency: string): IPaymentGatewayStrategy {
    const normalized = currency.trim().toUpperCase();

    switch (normalized) {
      case 'ETB':
        return telebirrStrategy;
      case 'USD':
        return stripeStrategy;
      default:
        throw new Error(`Unsupported currency for automatic gateway routing: ${currency}`);
    }
  }

  resolveByGateway(gateway: PaymentGateway): IPaymentGatewayStrategy {
    switch (gateway) {
      case PaymentGateway.TELEBIRR:
        return telebirrStrategy;
      case PaymentGateway.CBE_BIRR:
        return cbeBirrStrategy;
      case PaymentGateway.STRIPE:
        return stripeStrategy;
      case PaymentGateway.MANUAL_CASH:
        return {
          initiatePayment: async (amount, currency, referenceId) => ({
            gatewayUrl: '',
            rawResponse: {
              provider: PaymentGateway.MANUAL_CASH,
              status: 'RECORDED',
              referenceId,
              amount,
              currency,
            },
          }),
        };
      default: {
        const exhaustiveCheck: never = gateway;
        throw new Error(`Unsupported payment gateway: ${exhaustiveCheck}`);
      }
    }
  }

  /**
   * Routes to a gateway strategy using explicit gateway selection,
   * or falls back to currency-based routing (ETB → Telebirr, USD → Stripe).
   */
  resolve(currency: string, gateway?: PaymentGateway): IPaymentGatewayStrategy {
    if (gateway && gateway !== PaymentGateway.MANUAL_CASH) {
      return this.resolveByGateway(gateway);
    }

    if (gateway === PaymentGateway.MANUAL_CASH) {
      return this.resolveByGateway(PaymentGateway.MANUAL_CASH);
    }

    return this.resolveByCurrency(currency);
  }
}

export const paymentGatewayFactory = new PaymentGatewayFactory();
