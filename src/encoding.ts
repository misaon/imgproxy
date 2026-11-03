/* eslint-disable no-bitwise -- base64 works on bit groups */

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_URL_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const utf8Encoder =
  typeof TextEncoder === 'function'
    ? /* #__PURE__ */ new TextEncoder()
    : undefined;

const encodeUtf8Fallback = (text: string): Uint8Array => {
  const bytes: number[] = [];

  for (const character of text) {
    let codePoint = character.codePointAt(0)!;

    if (codePoint >= 0xd8_00 && codePoint <= 0xdf_ff) {
      codePoint = 0xff_fd;
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x8_00) {
      bytes.push(0xc0 | (codePoint >>> 6), 0x80 | (codePoint & 63));
    } else if (codePoint < 0x1_00_00) {
      bytes.push(
        0xe0 | (codePoint >>> 12),
        0x80 | ((codePoint >>> 6) & 63),
        0x80 | (codePoint & 63),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >>> 18),
        0x80 | ((codePoint >>> 12) & 63),
        0x80 | ((codePoint >>> 6) & 63),
        0x80 | (codePoint & 63),
      );
    }
  }

  return Uint8Array.from(bytes);
};

export const encodeUtf8 = (value: unknown): Uint8Array => {
  const text = String(value);

  return utf8Encoder ? utf8Encoder.encode(text) : encodeUtf8Fallback(text);
};

export const decodeHex = (value: unknown): Uint8Array => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError('imgproxy key and salt must be hex-encoded strings');
  }

  const hex = String(value);
  const bytes = new Uint8Array(hex.length >>> 1);

  for (let index = 0; index < bytes.length; index++) {
    const start = index * 2;
    bytes[index] = Number.parseInt(hex.slice(start, start + 2), 16);
  }

  return bytes;
};

const encode = (bytes: Uint8Array, alphabet: string): string => {
  let output = '';
  let index = 0;

  for (; index + 2 < bytes.length; index += 3) {
    const chunk =
      (bytes[index] << 16) | (bytes[index + 1] << 8) | bytes[index + 2];
    output +=
      alphabet[chunk >>> 18] +
      alphabet[(chunk >>> 12) & 63] +
      alphabet[(chunk >>> 6) & 63] +
      alphabet[chunk & 63];
  }

  const remaining = bytes.length - index;

  if (remaining === 1) {
    const chunk = bytes[index] << 16;
    output += alphabet[chunk >>> 18] + alphabet[(chunk >>> 12) & 63];
  } else if (remaining === 2) {
    const chunk = (bytes[index] << 16) | (bytes[index + 1] << 8);
    output +=
      alphabet[chunk >>> 18] +
      alphabet[(chunk >>> 12) & 63] +
      alphabet[(chunk >>> 6) & 63];
  }

  return output;
};

export const encodeBase64 = (bytes: Uint8Array): string => {
  const encoded = encode(bytes, BASE64_ALPHABET);

  return encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
};

export const encodeBase64Url = (bytes: Uint8Array): string =>
  encode(bytes, BASE64_URL_ALPHABET);
