/*
 * Display names — the web copy of lib/display_name.dart.
 *
 * The server trigger ume_validate_display_name() is the authority. These
 * functions exist so the wizard can say what is wrong BEFORE the save
 * round-trip, with the same rules, in the same order, and the same words the
 * app uses. If the two ever disagree, the server wins and
 * describeDisplayNameError() translates its refusal.
 *
 * Rules, mirrored exactly:
 *   - blank means "use my first name" and is always fine
 *   - 2 to 20 characters after trimming and collapsing spaces
 *   - starts with a letter, in any script
 *   - no digits, no @ # $ % ^ & * ( ) _ + = [ ] { } | \ / < > ~ ` "
 *   - nothing that looks like a URL
 *   - not a word that impersonates the app
 *
 * The rate limit (five changes in thirty days) is server-only and cannot
 * apply during onboarding.
 */

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 20;

// Built with the constructor, not a literal: the site's tsconfig has no
// explicit target and TypeScript refuses the `u` flag on a literal for ES5.
const STARTS_WITH_LETTER = new RegExp("^\\p{L}", "u");
const FORBIDDEN = /[0-9@#$%^&*()_+=[\]{}|\\\/<>~`"]/;
const URLISH = /(https?:|www\.|\.com|\.in\b)/i;

const RESERVED = new Set([
  "umelike",
  "ume like",
  "admin",
  "administrator",
  "support",
  "staff",
  "moderator",
  "mod",
  "official",
  "team",
  "umelike team",
  "help",
  "verified",
  "platinum",
]);

/** Trimmed, whitespace collapsed. Null when blank. */
export function normaliseDisplayName(raw: string): string | null {
  const clean = raw.trim().replace(/\s+/g, " ");
  return clean.length === 0 ? null : clean;
}

/** Null when acceptable, otherwise the sentence to show under the field. */
export function validateDisplayName(raw: string): string | null {
  const clean = normaliseDisplayName(raw);

  if (clean === null) {
    return null;
  }

  // Count code points, not UTF-16 units, so a Devanagari or Tamil name is
  // measured the way Postgres char_length() measures it.
  const length = Array.from(clean).length;

  if (length < DISPLAY_NAME_MIN) {
    return "A bit longer — at least two characters.";
  }

  if (length > DISPLAY_NAME_MAX) {
    return "Keep it under twenty characters.";
  }

  if (!STARTS_WITH_LETTER.test(clean)) {
    return "Start with a letter.";
  }

  if (FORBIDDEN.test(clean)) {
    return "Letters, spaces, dots and hyphens only.";
  }

  const lower = clean.toLowerCase();

  if (URLISH.test(lower)) {
    return "That looks like a link.";
  }

  if (RESERVED.has(lower) || lower.includes("umelike")) {
    return "That one’s taken.";
  }

  return null;
}

/** What other members will see, given the current field values. */
export function publicNamePreview(
  displayName: string | null,
  realName: string,
): string {
  const chosen = normaliseDisplayName(displayName ?? "");

  if (chosen !== null) {
    return chosen;
  }

  const first = realName.trim().split(/\s+/)[0] ?? "";

  return first.length === 0 ? "You" : first;
}

/**
 * Turns the server trigger's refusal into the same sentences as
 * validateDisplayName(). The Supabase error message carries the rule name.
 */
export function describeDisplayNameError(message: string): string {
  if (message.includes("display_name_length")) {
    return "Your nickname needs to be between two and twenty characters.";
  }
  if (message.includes("display_name_start")) {
    return "Your nickname needs to start with a letter.";
  }
  if (message.includes("display_name_chars")) {
    return "Your nickname can only use letters, spaces, dots and hyphens.";
  }
  if (message.includes("display_name_reserved")) {
    return "That nickname isn’t available.";
  }
  if (message.includes("display_name_rate")) {
    return "You’ve changed your nickname a few times recently. Try again in a couple of weeks.";
  }

  return "We couldn’t save that nickname.";
}

/** True when a Supabase error came from the display-name trigger. */
export function isDisplayNameError(message: string | undefined | null): boolean {
  return typeof message === "string" && message.includes("display_name_");
}
