/** Loose E.164 normalization (keep leading `+`, drop non-digits otherwise). */
export function normalizePhoneE164(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/\D/g, "")}`;
}

/** Validate a string looks like an E.164 number (8-15 digits with leading `+`). */
export function isValidMobileE164(mobile: string): boolean {
  const digits = mobile.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 && mobile.trim().startsWith("+");
}
