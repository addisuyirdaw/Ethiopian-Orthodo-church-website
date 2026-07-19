// src/validation/phone.ts

/**
 * Validation utility for Ethiopian and Diaspora phone formats.
 * Accepts Ethiopian format (+251... or 09.../07... followed by 8 digits)
 * or standard global formats.
 */
export const ETHIOPIA_PHONE_REGEX = /^(?:\+251|0)[97]\d{8}$/;

export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  return ETHIOPIA_PHONE_REGEX.test(clean) || (clean.length >= 10 && clean.startsWith('+'));
}
