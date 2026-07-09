import { Decimal } from '@prisma/client/runtime/library';

export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value.toString());
}

export function decimalToNumber(value: Decimal): number {
  return value.toNumber();
}

export const SPLIT_PERCENTAGES = {
  TARGET_LEAF: new Decimal('0.90'),
  IMMEDIATE_PARENT: new Decimal('0.07'),
  PATRIARCHATE: new Decimal('0.03'),
  TARGET_REGIONAL: new Decimal('0.97'),
  FULL: new Decimal('1.00'),
} as const;

export function sumDecimals(values: Decimal[]): Decimal {
  return values.reduce((acc, value) => acc.add(value), new Decimal(0));
}
