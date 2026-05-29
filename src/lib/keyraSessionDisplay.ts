export function formatPhoneDisplay(phoneE164: string): string {
  const t = phoneE164.trim();
  return t.startsWith("+") ? t : `+${t.replace(/^\+/, "")}`;
}
