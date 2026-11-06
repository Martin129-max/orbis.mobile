export function sessionFingerprint(token: string | null) {
  if (!token) return 'guest';
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash = Math.imul(hash ^ token.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36);
}
