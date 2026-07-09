export interface PaymentInitiationResult {
  gatewayUrl: string;
  rawResponse: Record<string, unknown>;
}

export interface IPaymentGatewayStrategy {
  initiatePayment(
    amount: number,
    currency: string,
    referenceId: string,
  ): Promise<PaymentInitiationResult>;
}
