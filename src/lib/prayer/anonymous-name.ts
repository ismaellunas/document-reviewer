const NAME_PREFIX = "Prayer Friend";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAnonymousPrayerName(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[bytes[i]! % CODE_CHARS.length];
  }
  return `${NAME_PREFIX} ${code}`;
}
