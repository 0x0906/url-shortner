/**
 * Normalizes email addresses to prevent sub-addressing / plus-addressing spoofing
 * and multi-account abuse (e.g., vigneshdev1309+a@gmail.com -> vigneshdev1309@gmail.com)
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";

  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2) return trimmed;

  let [localPart, domain] = parts;

  // Normalize common domain aliases
  if (domain === "googlemail.com") {
    domain = "gmail.com";
  }

  // Always strip plus-addressing tag (e.g. user+alias -> user)
  localPart = localPart.split("+")[0];

  // For Gmail / Google Workspace, remove all dots from username (e.g. v.i.g.n.e.s.h -> vignesh)
  if (domain === "gmail.com") {
    localPart = localPart.replace(/\./g, "");
  }

  return `${localPart}@${domain}`;
}

/**
 * Checks if the email contains a '+' alias in the local part
 */
export function hasEmailAlias(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const localPart = email.split("@")[0] || "";
  return localPart.includes("+");
}
