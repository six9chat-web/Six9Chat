import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/**
 * Six9Chat Phone Utilities
 * Ensures strict E.164 phone number formatting and validation across all authentication steps.
 */

export interface E164FormatResult {
  e164: string;
  nationalNumber: string;
  dialDigits: string;
  isValid: boolean;
  formattedDisplay: string;
  expectedLength: number;
}

/**
 * Standard expected national digit lengths by ISO country code
 */
export const COUNTRY_PHONE_LENGTHS: Record<string, number> = {
  PK: 10, // e.g. 300 1234567
  US: 10, // e.g. 202 555 0123
  CA: 10, // e.g. 416 555 0123
  GB: 10, // e.g. 7911 123456
  IN: 10, // e.g. 98123 45678
  AE: 9,  // e.g. 50 123 4567
  SA: 9,  // e.g. 50 123 4567
  DE: 10, // e.g. 151 23456789
  FR: 9,  // e.g. 6 12 34 56 78
  AU: 9,  // e.g. 412 345 678
  TR: 10, // e.g. 532 123 4567
  BR: 11, // e.g. 11 91234 5678
  JP: 10, // e.g. 90 1234 5678
  SG: 8,  // e.g. 8123 4567
  MY: 9,  // e.g. 12 345 6789
  QA: 8,  // e.g. 3312 3456
  KW: 8,  // e.g. 5012 3456
  OM: 8,  // e.g. 9123 4567
  BH: 8,  // e.g. 3612 3456
  ZA: 9,  // e.g. 71 123 4567
  EG: 10, // e.g. 10 1234 5678
  NG: 10, // e.g. 802 123 4567
  ID: 10, // e.g. 812 3456 7890
  BD: 10, // e.g. 1712 345678
  PH: 10, // e.g. 917 123 4567
  NL: 9,  // e.g. 6 12345678
  ES: 9,  // e.g. 612 34 56 78
  IT: 10, // e.g. 320 123 4567
  CH: 9,  // e.g. 78 123 45 67
  SE: 9,  // e.g. 70 123 45 67
  NO: 8,  // e.g. 412 34 567
  NZ: 9,  // e.g. 21 123 4567
  IE: 9,  // e.g. 85 123 4567
  MX: 10, // e.g. 55 1234 5678
  AR: 10, // e.g. 9 11 1234 5678
  KR: 10, // e.g. 10 1234 5678
  CN: 11, // e.g. 138 0013 8000
  VN: 9,  // e.g. 91 234 5678
  TH: 9,  // e.g. 81 234 5678
  JO: 9,  // e.g. 7 9123 4567
  LB: 8,  // e.g. 70 123 456
  MA: 9,  // e.g. 612 345 678
  PL: 9,  // e.g. 512 345 678
  PT: 9,  // e.g. 912 345 678
  RU: 10, // e.g. 912 345 67 89
};

/**
 * Returns expected national phone number digit length for a given country ISO code
 */
export function getExpectedPhoneLength(countryCode: string = "PK"): number {
  const code = (countryCode || "PK").toUpperCase();
  return COUNTRY_PHONE_LENGTHS[code] || 10;
}

/**
 * Formats any raw input string with country dial code into strict E.164 standard.
 * Enforces country-specific digit limit and precise validation.
 */
export function formatE164(
  dialCode: string,
  inputNumber: string,
  countryCode?: string
): E164FormatResult {
  const dialDigits = (dialCode || "").replace(/\D/g, "");
  let cleanInput = (inputNumber || "").replace(/\D/g, "");
  const expectedLength = getExpectedPhoneLength(countryCode || "PK");

  // If user pasted input that already includes the country dial code at the beginning, strip it
  if (dialDigits && cleanInput.startsWith(dialDigits)) {
    cleanInput = cleanInput.slice(dialDigits.length);
  }

  // Strip leading national trunk zeros (e.g. 0341... -> 341...)
  cleanInput = cleanInput.replace(/^0+/, "");

  // Prevent excess digits beyond expected national length
  if (cleanInput.length > expectedLength) {
    cleanInput = cleanInput.slice(0, expectedLength);
  }

  const e164 = dialDigits ? `+${dialDigits}${cleanInput}` : cleanInput;

  // Exact digit match
  let isValid = cleanInput.length === expectedLength;

  if (isValid && countryCode) {
    try {
      const parsed = parsePhoneNumberFromString(e164, countryCode.toUpperCase() as CountryCode);
      if (parsed) {
        isValid = (parsed.isValid() || parsed.isPossible()) && cleanInput.length === expectedLength;
      }
    } catch {
      isValid = cleanInput.length === expectedLength;
    }
  }

  const formattedDisplay = dialDigits && cleanInput
    ? `+${dialDigits} ${cleanInput}`
    : e164;

  return {
    e164,
    nationalNumber: cleanInput,
    dialDigits,
    isValid,
    formattedDisplay,
    expectedLength,
  };
}
