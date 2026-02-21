import type { NICData } from '@/types';

/**
 * Parse Sri Lankan National Identity Card numbers.
 * Old format: 9 digits + V or X (e.g., 901234567V)
 * New format: 12 digits (e.g., 199012345678)
 */
export function parseSriLankanNIC(nic: string): NICData | null {
  const cleaned = nic.trim().toUpperCase();

  const oldFormat = /^(\d{2})(\d{3})(\d{4})(V|X)$/;
  const newFormat = /^(\d{4})(\d{3})(\d{5})$/;

  let birthYear: number;
  let dayOfYear: number;
  let format: 'old' | 'new';

  if (oldFormat.test(cleaned)) {
    const match = cleaned.match(oldFormat)!;
    birthYear = 1900 + parseInt(match[1]);
    dayOfYear = parseInt(match[2]);
    format = 'old';
  } else if (newFormat.test(cleaned)) {
    const match = cleaned.match(newFormat)!;
    birthYear = parseInt(match[1]);
    dayOfYear = parseInt(match[2]);
    format = 'new';
  } else {
    return null;
  }

  const gender = dayOfYear > 500 ? 'female' : 'male';
  const actualDay = gender === 'female' ? dayOfYear - 500 : dayOfYear;

  // Convert day-of-year to actual date
  const dateOfBirth = new Date(birthYear, 0); // Jan 1
  dateOfBirth.setDate(actualDay);

  const isValid = actualDay >= 1 && actualDay <= 366;

  return {
    nicNumber: cleaned,
    format,
    birthYear,
    birthDayOfYear: actualDay,
    dateOfBirth,
    gender,
    isValid,
  };
}

export function formatNICForDisplay(nic: string): string {
  const parsed = parseSriLankanNIC(nic);
  if (!parsed) return nic;

  const dob = parsed.dateOfBirth.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `${parsed.nicNumber} (${parsed.gender === 'female' ? 'Female' : 'Male'}, born ${dob})`;
}
