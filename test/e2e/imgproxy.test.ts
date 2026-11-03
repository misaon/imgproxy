/* eslint-disable @typescript-eslint/naming-convention -- public option names */
import { describe, expect, inject, test } from 'vitest';
import {
  generateHmac,
  generateSignature,
  getImageUrl,
  type ModifierOptions,
} from '../../src/index.js';
import { FIXTURE_HEIGHT, FIXTURE_WIDTH, type KeyPair } from './setup.js';

const { baseUrl, sourceBase, pairs } = inject('imgproxy');
const source = `${sourceBase}/dog.png`;

const request = async (url: string) => {
  const response = await fetch(url);
  const body = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(body.buffer);
  const isPng = body[1] === 0x50 && body[2] === 0x4e && body[3] === 0x47;

  return {
    status: response.status,
    type: response.headers.get('content-type'),
    size: isPng ? `${view.getUint32(16)}x${view.getUint32(20)}` : undefined,
  };
};

const sign = (
  pair: KeyPair,
  modifiers: ModifierOptions,
  from = source,
): string => {
  const { secret, salt } = pair;

  return getImageUrl(from, { secret, salt, baseURL: baseUrl, modifiers });
};

describe.each(pairs)('imgproxy accepts signatures ($label)', (pair) => {
  test.each<[string, ModifierOptions, string]>([
    ['width and height', { width: 200, height: 150, format: 'png' }, '200x150'],
    [
      'resize as an array',
      { resize: ['fill', 120, 80], format: 'png' },
      '120x80',
    ],
    [
      'numbers and booleans',
      { width: FIXTURE_WIDTH * 2, enlarge: true, format: 'png' },
      `${FIXTURE_WIDTH * 2}x${FIXTURE_HEIGHT * 2}`,
    ],
    [
      'dpr and flip',
      { width: 100, dpr: 2, flip: [true, false], format: 'png' },
      '200x150',
    ],
  ])('%s', async (_name, modifiers, size) => {
    await expect(request(sign(pair, modifiers))).resolves.toMatchObject({
      status: 200,
      size,
    });
  });

  test('short option names', async () => {
    const modifiers: Record<string, string | number> = {
      w: 100,
      h: 50,
      rt: 'force',
      f: 'png',
    };

    await expect(request(sign(pair, modifiers))).resolves.toMatchObject({
      status: 200,
      size: '100x50',
    });
  });

  test('webp output', async () => {
    await expect(
      request(sign(pair, { width: 100, format: 'webp', quality: 70 })),
    ).resolves.toMatchObject({ status: 200, type: 'image/webp' });
  });

  test('option combinations', async () => {
    const gravities = ['ce', 'no', 'so', 'ea', 'we', 'sm'];
    const formats = ['png', 'jpg', 'webp'];
    const resizingTypes = ['fit', 'fill', 'fill-down', 'force', 'auto'];
    const urls = Array.from({ length: 20 }, (_, index) => {
      const modifiers: ModifierOptions = {
        resize: [resizingTypes[index % 5], 20 + index * 13, 20 + index * 7],
        gravity: gravities[index % 6],
        format: formats[index % 3],
        quality: 30 + index,
        ...(index % 2 === 0 && { blur: index % 4 }),
        ...(index % 3 === 0 && { rotate: 90 }),
        ...(index % 4 === 0 && { cachebuster: `v${index}` }),
      };

      return sign(pair, modifiers);
    });
    const responses = await Promise.all(urls.map(async (url) => request(url)));

    expect(responses.map((response) => response.status)).toEqual(
      urls.map(() => 200),
    );
  });
});

describe('imgproxy behavior', () => {
  const pair = pairs[0];

  test('UTF-8 source path', async () => {
    const url = sign(
      pair,
      { width: 40, format: 'png' },
      `${sourceBase}/obrázek-řeřicha.png`,
    );

    await expect(request(url)).resolves.toMatchObject({
      status: 200,
      size: '40x30',
    });
  });

  test('a reused generateHmac result signs several paths', async () => {
    const hmac = generateHmac(pair.secret, pair.salt);
    const paths = [
      `/rs:fit:64:64/f:png/plain/${source}`,
      `/rs:fit:32:32/f:png/plain/${source}`,
    ];
    const signedUrl = (path: string) =>
      `${baseUrl}/${generateSignature(hmac, path)}${path}`;
    const responses = await Promise.all(
      paths.map(async (path) => request(signedUrl(path))),
    );

    expect(responses).toMatchObject([
      { status: 200, size: '64x48' },
      { status: 200, size: '32x24' },
    ]);
  });

  test('unsafe modifier names are skipped', async () => {
    const modifiers: Record<string, string | number> = {
      [`x/plain/${sourceBase}/obrázek-řeřicha.png#`]: 1,
      width: 50,
      format: 'png',
    };

    await expect(request(sign(pair, modifiers))).resolves.toMatchObject({
      status: 200,
      size: '50x38',
    });
  });

  test('undefined values fail closed', async () => {
    const response = await request(
      sign(pair, { width: undefined, format: 'png' }),
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test('a wrong salt is rejected', async () => {
    const url = sign({ ...pair, salt: '00' }, { width: 40 });

    await expect(request(url)).resolves.toMatchObject({ status: 403 });
  });

  test('tampered options are rejected', async () => {
    const url = sign(pair, { width: 40, format: 'png' }).replace(
      '/w:40/',
      '/w:41/',
    );

    await expect(request(url)).resolves.toMatchObject({ status: 403 });
  });
});
