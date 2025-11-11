/**
 * Validators for communication channels (email, phone, WhatsApp)
 */

/**
 * Validates email format according to RFC 5322 (simplified version)
 * Uses a comprehensive regex pattern that covers most valid email addresses
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim().length === 0) {
    return false;
  }

  // RFC 5322 compliant regex (simplified but covers most cases)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email.trim());
}

/**
 * Validates phone number format according to E.164 standard
 * Format: +[country code][number] (e.g., +56912345678)
 * Regex: ^\+[1-9]\d{1,14}$
 */
export function validateE164(phone: string): boolean {
  if (!phone || phone.trim().length === 0) {
    return false;
  }

  // E.164 format: +[country code][number], max 15 digits total
  const e164Regex = /^\+[1-9]\d{1,14}$/;

  return e164Regex.test(phone.trim());
}

/**
 * Normalizes phone number to E.164 format
 * Attempts to add country code if missing (requires countryCode parameter)
 * Returns normalized phone or null if invalid
 */
export function normalizeToE164(
  phone: string,
  countryCode?: string,
): string | null {
  if (!phone) {
    return null;
  }

  const cleaned = phone.replace(/[^\d+]/g, "");

  // Already in E.164 format
  if (cleaned.startsWith("+")) {
    return validateE164(cleaned) ? cleaned : null;
  }

  // Try to add country code if provided
  if (countryCode) {
    const normalized = `+${countryCode}${cleaned}`;
    if (validateE164(normalized)) {
      return normalized;
    }
  }

  // If no country code provided or normalization failed, return null
  return null;
}

/**
 * Validates IANA timezone identifier
 * Checks against a list of common timezones (not exhaustive, but covers most use cases)
 * For production, consider using a library like 'tzdata' or validating against a full IANA database
 */
export function validateIANATimezone(timezone: string): boolean {
  if (!timezone || timezone.trim().length === 0) {
    return false;
  }

  // Common IANA timezone patterns
  const timezonePatterns = [
    /^[A-Z][a-z]+\/[A-Z][a-z_]+$/, // America/New_York, Europe/London
    /^[A-Z][a-z]+\/[A-Z][a-z]+\/[A-Z][a-z_]+$/, // America/Argentina/Buenos_Aires
    /^[A-Z][a-z]+\/[A-Z][a-z]+$/, // America/Santiago, Europe/Madrid
    /^[A-Z]{3,4}$/, // UTC, GMT
  ];

  return timezonePatterns.some((pattern) => pattern.test(timezone.trim()));
}

/**
 * Common IANA timezones for Latin America (most common use case)
 */
export const COMMON_LATAM_TIMEZONES = [
  "America/Santiago",
  "America/Mexico_City",
  "America/Bogota",
  "America/Buenos_Aires",
  "America/Lima",
  "America/Caracas",
  "America/Montevideo",
  "America/Asuncion",
  "America/Guayaquil",
  "America/La_Paz",
] as const;

/**
 * Common IANA timezones for North America
 */
export const COMMON_NA_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
] as const;

/**
 * Common IANA timezones for Europe
 */
export const COMMON_EU_TIMEZONES = [
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Lisbon",
] as const;

/**
 * All common timezones combined
 */
export const COMMON_TIMEZONES = [
  ...COMMON_LATAM_TIMEZONES,
  ...COMMON_NA_TIMEZONES,
  ...COMMON_EU_TIMEZONES,
] as const;

/**
 * Validates working hours window JSON structure
 * Expected format: { start: "HH:mm", end: "HH:mm", days: number[] }
 * days: array of 1-7 (Monday=1, Sunday=7)
 */
export interface WorkingHoursWindow {
  start: string; // HH:mm format
  end: string; // HH:mm format
  days: number[]; // 1-7 (Monday=1, Sunday=7)
}

export function validateWorkingHoursWindow(
  window: unknown,
): window is WorkingHoursWindow {
  if (!window || typeof window !== "object") {
    return false;
  }

  const w = window as Record<string, unknown>;

  // Check start and end are strings in HH:mm format
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (
    typeof w.start !== "string" ||
    typeof w.end !== "string" ||
    !timeRegex.test(w.start) ||
    !timeRegex.test(w.end)
  ) {
    return false;
  }

  // Check start < end
  const [startHour, startMin] = w.start.split(":").map(Number);
  const [endHour, endMin] = w.end.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes >= endMinutes) {
    return false;
  }

  // Check days is an array of numbers 1-7
  if (!Array.isArray(w.days) || w.days.length === 0) {
    return false;
  }

  const validDays = w.days.every(
    (day) => typeof day === "number" && day >= 1 && day <= 7,
  );

  return validDays;
}

