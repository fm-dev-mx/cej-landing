/** Shared capture/import/Meta normalization. Unknown stays null; unsupported formats require review. */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (/^\d{10}$/.test(digits)) return `52${digits}`;
  if (/^1\d{10}$/.test(digits) || /^52\d{10}$/.test(digits)) return digits;
  if (/^521\d{10}$/.test(digits)) return `52${digits.slice(3)}`;
  throw new Error("phone_invalid");
}
