import {
  decodeHex,
  encodeBase64,
  encodeBase64Url,
  encodeUtf8,
} from './encoding.js';
import { createHmacKey, type HmacKey, signHmac } from './hmac.js';
import { type ModifierOptions, modifiersGenerator } from './modifiers.js';

export type { HmacKey } from './hmac.js';
export {
  type ModifierOptions,
  type ModifierPrimitive,
  type Modifiers,
  type ModifierValue,
  modifiersGenerator,
} from './modifiers.js';

export type ImageUrlOptions = {
  secret: string;
  salt: string;
  baseURL?: string | undefined;
  modifiers: ModifierOptions;
};

export const toBase64 = (value: string): string =>
  encodeBase64(encodeUtf8(value));

export const trimBase64 = (value: string): string =>
  value.replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');

export const generateHmac = (secret: string, salt: string): HmacKey =>
  createHmacKey(decodeHex(secret), decodeHex(salt));

export const generateSignature = (hmac: HmacKey, path: string): string =>
  encodeBase64Url(signHmac(hmac, encodeUtf8(path)));

const MAX_CACHED_KEYS = 16;
const hmacCache = /* #__PURE__ */ new Map<string, HmacKey>();

const getHmac = (secret: unknown, salt: unknown): HmacKey => {
  const secretText = String(secret);
  const cacheKey = `${secretText.length}:${secretText}${String(salt)}`;
  let hmac = hmacCache.get(cacheKey);

  if (!hmac) {
    if (hmacCache.size >= MAX_CACHED_KEYS) {
      hmacCache.clear();
    }

    hmac = createHmacKey(decodeHex(secret), decodeHex(salt));
    hmacCache.set(cacheKey, hmac);
  }

  return hmac;
};

const joinUrl = (base: string, ...segments: string[]): string => {
  let url = base;

  for (const segment of segments) {
    if (segment === '' || segment === '/') {
      continue;
    }

    url =
      url === ''
        ? segment
        : `${url.endsWith('/') ? url : `${url}/`}${segment.startsWith('/') ? segment.slice(1) : segment}`;
  }

  return url;
};

export function getImageUrl(
  imageSource: string,
  options: ImageUrlOptions,
): string {
  const path = joinUrl(
    '/',
    modifiersGenerator(options.modifiers),
    encodeBase64Url(encodeUtf8(imageSource)),
  );
  const signature = generateSignature(
    getHmac(options.secret, options.salt),
    path,
  );

  return joinUrl(options.baseURL ?? '/', signature, path);
}
