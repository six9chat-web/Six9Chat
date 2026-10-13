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
}

/**
 * Formats any raw input string with country dial code into strict E.164 standard.
 * Examples:
 * - formatE164("+92", "3414348189") -> e164: "+923414348189"
 * - formatE164("+92", "03414348189") -> e164: "+923414348189" (strips leading 0)
 * - formatE164("+92", "+923414348189") -> e164: "+923414348189" (strips duplicate dial code)
 * - formatE164("+92", "923414348189") -> e164: "+923414348189" (strips duplicate dial code)
 * - formatE164("+1", "(555) 019-2834") -> e164: "+15550192834"
 * - formatE164("+44", "07123 456789") -> e164: "+447123456789"
 */
export function formatE164(dialCode: string, inputNumber: string): E164FormatResult {
  const dialDigits = (dialCode || "").replace(/\D/g, "");
  let cleanInput = (inputNumber || "").replace(/\D/g, "");

  // If user pasted input that already includes the country dial code at the beginning, strip it
  if (dialDigits && cleanInput.startsWith(dialDigits)) {
    cleanInput = cleanInput.slice(dialDigits.length);
  }

  // Strip leading national trunk zeros (e.g. 0341... -> 341...)
  cleanInput = cleanInput.replace(/^0+/, "");

  const e164 = dialDigits ? `+${dialDigits}${cleanInput}` : cleanInput;
  const isValid = dialDigits.length >= 1 && cleanInput.length >= 6 && cleanInput.length <= 15;

  const formattedDisplay = dialDigits && cleanInput
    ? `+${dialDigits} ${cleanInput}`
    : e164;

  return {
    e164,
    nationalNumber: cleanInput,
    dialDigits,
    isValid,
    formattedDisplay,
  };
}
