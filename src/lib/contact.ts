const digitsOf = (phone: string) => phone.replace(/[^\d+]/g, "");

/** `tel:` link; bare 10-digit numbers are treated as Indian mobiles. */
export function telHref(phone: string): string {
  const digits = digitsOf(phone);
  if (/^\d{10}$/.test(digits)) return `tel:+91${digits}`;
  return `tel:${digits}`;
}

export function formatPhone(phone: string): string {
  const digits = digitsOf(phone);
  if (/^\d{10}$/.test(digits)) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
}

export function instagramHandle(url: string): string {
  try {
    const handle = new URL(url).pathname.split("/").filter(Boolean)[0];
    return handle ? `@${handle}` : "Instagram";
  } catch {
    return "Instagram";
  }
}
