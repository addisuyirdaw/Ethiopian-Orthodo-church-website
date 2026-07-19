// src/validation/ethiopicName.ts

/**
 * Validation utilities for Amharic/Ethiopic name characters.
 * Accepts Unicode range U+1200 to U+137F (Ethiopic) and whitespace.
 */
export const ETHIOPIC_REGEX = /^[\u1200-\u137F\s]+$/;

export function isValidEthiopic(name: string): boolean {
  return ETHIOPIC_REGEX.test(name.trim());
}
