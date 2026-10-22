/**
 * Phone Number Validation & Formatting Utilities for Avsaraa
 * Supports Indian (+91) standard mobile numbers and E.164 international numbers.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string; // e.g. "+919876543210"
  formatted: string;  // e.g. "+91 98765 43210"
  error?: string;
}

/**
 * Normalizes a raw phone input string with an optional country code.
 */
export function normalizePhoneNumber(
  rawInput: string,
  defaultCountryCode = "+91"
): PhoneValidationResult {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      isValid: false,
      normalized: "",
      formatted: "",
      error: "Phone number is required.",
    };
  }

  // Remove whitespace, dashes, parens, dots
  let cleaned = rawInput.trim().replace(/[\s\-\(\)\.]/g, "");

  // If starts with 00, replace with +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // Handle Indian domestic prefixes (e.g. "09876543210")
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Check if international prefix (+) is present
  let fullE164 = "";
  if (cleaned.startsWith("+")) {
    fullE164 = cleaned;
  } else {
    // Prefix default country code
    const prefix = defaultCountryCode.startsWith("+")
      ? defaultCountryCode
      : `+${defaultCountryCode}`;
    fullE164 = `${prefix}${cleaned}`;
  }

  // Extract digits only
  const digitsOnly = fullE164.replace(/\D/g, "");

  // Validation checks:
  // 1. Min 10 digits, max 15 digits (ITU-T E.164 standard)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return {
      isValid: false,
      normalized: fullE164,
      formatted: fullE164,
      error: "Phone number must be between 10 and 15 digits.",
    };
  }

  // 2. India (+91) specific validation: exactly 10 digits after 91
  if (fullE164.startsWith("+91")) {
    const indianDigits = fullE164.slice(3);
    if (indianDigits.length !== 10) {
      return {
        isValid: false,
        normalized: fullE164,
        formatted: fullE164,
        error: "Indian mobile number must be exactly 10 digits.",
      };
    }
    // Must start with 6, 7, 8, or 9
    if (!/^[6-9]/.test(indianDigits)) {
      return {
        isValid: false,
        normalized: fullE164,
        formatted: fullE164,
        error: "Indian mobile number must start with 6, 7, 8, or 9.",
      };
    }

    const formatted = `+91 ${indianDigits.slice(0, 5)} ${indianDigits.slice(5)}`;
    return {
      isValid: true,
      normalized: fullE164,
      formatted,
    };
  }

  // Other countries: generic formatting
  return {
    isValid: true,
    normalized: fullE164,
    formatted: fullE164,
  };
}

/**
 * Safely masks a phone number for user privacy in error/recovery messages
 * e.g. "+919876543210" -> "+91 98••••••10"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[\s\-]/g, "");
  if (cleaned.length < 8) return "••••••••";
  const start = cleaned.slice(0, 5);
  const end = cleaned.slice(-2);
  return `${start}••••••${end}`;
}

/**
 * Safely masks an email address for privacy in error/recovery messages
 * e.g. "priya.sharma@gmail.com" -> "p••••a@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "••••@••••";
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}•@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}${"•".repeat(Math.min(local.length - 2, 6))}${last}@${domain}`;
}
