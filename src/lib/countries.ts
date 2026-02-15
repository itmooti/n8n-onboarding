export interface Country {
  name: string;
  code: string;
  phonePrefix: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: 'Australia', code: 'AU', phonePrefix: '+61', flag: '\u{1F1E6}\u{1F1FA}' },
  { name: 'New Zealand', code: 'NZ', phonePrefix: '+64', flag: '\u{1F1F3}\u{1F1FF}' },
  { name: 'United Kingdom', code: 'GB', phonePrefix: '+44', flag: '\u{1F1EC}\u{1F1E7}' },
  { name: 'United States', code: 'US', phonePrefix: '+1', flag: '\u{1F1FA}\u{1F1F8}' },
  { name: 'Canada', code: 'CA', phonePrefix: '+1', flag: '\u{1F1E8}\u{1F1E6}' },
  { name: 'Singapore', code: 'SG', phonePrefix: '+65', flag: '\u{1F1F8}\u{1F1EC}' },
  { name: 'Hong Kong', code: 'HK', phonePrefix: '+852', flag: '\u{1F1ED}\u{1F1F0}' },
  { name: 'India', code: 'IN', phonePrefix: '+91', flag: '\u{1F1EE}\u{1F1F3}' },
  { name: 'Philippines', code: 'PH', phonePrefix: '+63', flag: '\u{1F1F5}\u{1F1ED}' },
  { name: 'South Africa', code: 'SA', phonePrefix: '+27', flag: '\u{1F1FF}\u{1F1E6}' },
  { name: 'Ireland', code: 'IE', phonePrefix: '+353', flag: '\u{1F1EE}\u{1F1EA}' },
  { name: 'Germany', code: 'DE', phonePrefix: '+49', flag: '\u{1F1E9}\u{1F1EA}' },
  { name: 'France', code: 'FR', phonePrefix: '+33', flag: '\u{1F1EB}\u{1F1F7}' },
  { name: 'Netherlands', code: 'NL', phonePrefix: '+31', flag: '\u{1F1F3}\u{1F1F1}' },
  { name: 'Japan', code: 'JP', phonePrefix: '+81', flag: '\u{1F1EF}\u{1F1F5}' },
  { name: 'UAE', code: 'AE', phonePrefix: '+971', flag: '\u{1F1E6}\u{1F1EA}' },
  { name: 'Malaysia', code: 'MY', phonePrefix: '+60', flag: '\u{1F1F2}\u{1F1FE}' },
  { name: 'Indonesia', code: 'ID', phonePrefix: '+62', flag: '\u{1F1EE}\u{1F1E9}' },
  { name: 'Thailand', code: 'TH', phonePrefix: '+66', flag: '\u{1F1F9}\u{1F1ED}' },
  { name: 'Brazil', code: 'BR', phonePrefix: '+55', flag: '\u{1F1E7}\u{1F1F7}' },
];

/** Look up phone prefix by country name. Returns '+61' as fallback. */
export function getPhonePrefix(countryName: string): string {
  return COUNTRIES.find((c) => c.name === countryName)?.phonePrefix || '+61';
}

/** Look up country name by ISO code. Returns null if not found. */
export function countryFromCode(code: string): string | null {
  return COUNTRIES.find((c) => c.code === code.toUpperCase())?.name || null;
}

/** Check if a string is just a phone prefix (no actual number). */
export function isOnlyPrefix(value: string): boolean {
  const trimmed = value.trim();
  return COUNTRIES.some((c) => c.phonePrefix === trimmed) || trimmed === '';
}
