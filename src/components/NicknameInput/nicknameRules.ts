export const NICKNAME_MIN_LEN = 2;
export const NICKNAME_MAX_LEN = 24;

const NICKNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

/** `Guest_` + 4 random digits (1000–9999). */
export function createGuestNickname(): string {
  const n = 1000 + Math.floor(Math.random() * 9000);
  return `Guest_${n}`;
}

/** Returns a user-facing validation message, or `null` when valid. */
export function validateNickname(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length < NICKNAME_MIN_LEN) {
    return `Use at least ${NICKNAME_MIN_LEN} characters.`;
  }
  if (trimmed.length > NICKNAME_MAX_LEN) {
    return `Use at most ${NICKNAME_MAX_LEN} characters.`;
  }
  if (trimmed !== raw) {
    return "Spaces are not allowed.";
  }
  if (!NICKNAME_PATTERN.test(trimmed)) {
    return "Letters, numbers, and underscore only.";
  }
  return null;
}

export function isNicknameValid(raw: string): boolean {
  return validateNickname(raw) === null;
}
