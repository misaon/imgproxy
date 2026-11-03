/* eslint-disable @typescript-eslint/naming-convention -- public option names */
import { createHmac, createSecretKey } from 'node:crypto';
import * as legacy from '@misaon/imgproxy-v1';
import { describe, expect, test } from 'vitest';
import {
  generateHmac,
  generateSignature,
  getImageUrl,
  type Modifiers,
  modifiersGenerator,
  toBase64,
  trimBase64,
} from '../src/index.js';

const createRandomInt = (seed: number) => {
  const modulus = 2_147_483_647;
  let state = seed;

  return (max: number): number => {
    state = (state * 48_271) % modulus;

    return Math.floor((state / modulus) * max);
  };
};

const randomInt = createRandomInt(20_230_301);

const pick = <T>(items: readonly T[]): T => items[randomInt(items.length)];

const randomHex = (bytes: number): string => {
  const pairs = Array.from({ length: bytes }, () =>
    randomInt(256).toString(16).padStart(2, '0'),
  );

  return pairs.join('');
};

const randomAscii = (length: number): string => {
  const codePoints = Array.from({ length }, () => 32 + randomInt(95));

  return String.fromCodePoint(...codePoints);
};

const legacyModifierNames = [
  'min-height',
  'min-width',
  'adjust',
  'auto_rotate',
  'background',
  'blur',
  'blur_detections',
  'crop',
  'dpr',
  'enlarge',
  'extend',
  'format',
  'format_quality',
  'gravity',
  'height',
  'padding',
  'page',
  'quality',
  'resize',
  'size',
  'skip_processing',
  'style',
  'unsharpening',
  'watermark',
  'watermark_shadow',
  'width',
  'zoom',
] as const satisfies ReadonlyArray<keyof Modifiers>;

const randomModifiers = (): Modifiers => {
  const entries = Array.from(
    { length: randomInt(8) },
    () => [pick(legacyModifierNames), randomAscii(randomInt(6))] as const,
  );

  return Object.fromEntries(entries);
};

describe('HMAC-SHA256 matches node:crypto', () => {
  test.each([0, 1, 31, 32, 63, 64, 65, 100, 128, 200])(
    'key and salt of %i bytes',
    (size) => {
      const key = randomHex(size);
      const salt = randomHex(size);

      for (let length = 0; length <= 200; length++) {
        const message = randomAscii(length);
        const expected = createHmac('sha256', createSecretKey(key, 'hex'))
          .update(salt, 'hex')
          .update(message)
          .digest('base64url');

        expect(generateSignature(generateHmac(key, salt), message)).toBe(
          expected,
        );
      }
    },
  );
});

describe('output matches @misaon/imgproxy 1.0.1', () => {
  test('non-ASCII sources are UTF-8 encoded, unlike 1.0.1', () => {
    const options = {
      secret: '6F787973686F70',
      salt: '10D16F7A61',
      modifiers: {},
    };
    const source = 'https://example.com/café.jpg';

    expect(getImageUrl(source, options)).not.toBe(
      legacy.getImageUrl(source, options),
    );
    expect(getImageUrl(source, options)).toContain(
      '/aHR0cHM6Ly9leGFtcGxlLmNvbS9jYWbDqS5qcGc',
    );
  });

  test('toBase64 and trimBase64', () => {
    for (let index = 0; index < 500; index++) {
      const value = randomAscii(randomInt(120));

      expect(toBase64(value)).toBe(legacy.toBase64(value));
      expect(trimBase64(toBase64(value))).toBe(
        legacy.trimBase64(legacy.toBase64(value)),
      );
    }
  });

  test('modifiersGenerator writes nullish values like 1.0.1', () => {
    const nullish: Record<string, undefined> = {
      cachebuster: undefined,
      expires: undefined,
    };

    expect(modifiersGenerator(nullish)).toBe(
      legacy.modifiersGenerator(nullish),
    );
  });

  test('modifiersGenerator', () => {
    for (let index = 0; index < 500; index++) {
      const modifiers = randomModifiers();

      expect(modifiersGenerator(modifiers)).toBe(
        legacy.modifiersGenerator(modifiers),
      );
    }
  });

  test('getImageUrl', () => {
    const baseUrls = [
      undefined,
      '',
      '/',
      '/imgproxy',
      '/imgproxy/',
      'https://imgproxy.example.com',
      'https://imgproxy.example.com/',
    ];

    for (let index = 0; index < 500; index++) {
      const imageSource = `https://example.com/${randomAscii(randomInt(80))}`;
      const baseURL = pick(baseUrls);
      const options = {
        secret: randomHex(randomInt(70)),
        salt: randomHex(randomInt(70)),
        modifiers: randomModifiers(),
        ...(baseURL !== undefined && { baseURL }),
      };

      expect(getImageUrl(imageSource, options)).toBe(
        legacy.getImageUrl(imageSource, options),
      );
    }
  });
});
