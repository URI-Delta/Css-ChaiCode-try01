import { createHash, randomBytes } from 'node:crypto';

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('hex');

/** Generates a reset/verify token pair: { raw: 'sent to user', hash: 'stored' }. */
export function createTokenPair(bytes = 32) {
  const raw = randomToken(bytes);
  return { raw, hash: sha256(raw) };
}
