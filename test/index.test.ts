/* eslint-disable @typescript-eslint/naming-convention -- public option names */
import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import {
  generateHmac,
  generateSignature,
  getImageUrl,
  type ImageUrlOptions,
  type ModifierOptions,
  type Modifiers,
  modifiersGenerator,
  toBase64,
  trimBase64,
} from '../src/index.js';

const imgproxySecret = '6F787973686F70';
const imgproxySalt = '10D16F7A61';
const imageUrl = 'https://img.dog-learn.com/dog-breeds/maltese/maltese-sz5.jpg';
const encodedImageUrl =
  'aHR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9kb2ctYnJlZWRzL21hbHRlc2UvbWFsdGVzZS1zejUuanBn';

describe('@misaon/imgproxy', () => {
  test('toBase64', () => {
    expect(toBase64(imageUrl)).toBe(encodedImageUrl);
  });

  test('toBase64 encodes non-ASCII characters as UTF-8', () => {
    expect(toBase64('https://example.com/obrázek-řeřicha.jpg')).toBe(
      'aHR0cHM6Ly9leGFtcGxlLmNvbS9vYnLDoXplay3FmWXFmWljaGEuanBn',
    );
  });

  test('toBase64 works without a global TextEncoder', async () => {
    const samples = [
      imageUrl,
      'https://example.com/obrázek-řeřicha.jpg',
      'emoji 😀 and CJK 日本',
      'lone surrogate \u{D800} end',
    ];
    vi.stubGlobal('TextEncoder', undefined);
    vi.resetModules();
    const fallback = await import('../src/index.js');

    for (const sample of samples) {
      expect(fallback.toBase64(sample)).toBe(toBase64(sample));
    }
  });

  test('trimBase64', () => {
    expect(
      trimBase64(
        'a=HR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9k+b2ctYnJlZWRzL21hbHRlc2U/bWFsdGVzZS1zejUuanBn',
      ),
    ).toBe(
      'aHR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9k-b2ctYnJlZWRzL21hbHRlc2U_bWFsdGVzZS1zejUuanBn',
    );
  });

  test('modifiersGenerator', () => {
    expect(modifiersGenerator({ width: '768', height: '0' })).toBe('h:0/w:768');
  });

  test('modifiersGenerator accepts numbers, booleans and argument lists', () => {
    expect(
      modifiersGenerator({
        resize: ['fill', 300, 200, true],
        enlarge: true,
        quality: 80,
        gravity: 'sm',
      }),
    ).toBe('el:true/g:sm/q:80/rs:fill:300:200:true');
  });

  test('modifiersGenerator writes nullish values as text like 1.0.1', () => {
    const modifiers = JSON.parse(
      '{"width": 300, "blur": null}',
    ) as ModifierOptions;

    expect(modifiersGenerator({ ...modifiers, expires: undefined })).toBe(
      'bl:null/exp:undefined/w:300',
    );
  });

  test('modifiersGenerator keeps unknown modifiers as they are', () => {
    const modifiers: Record<string, string> = {
      custom_option: 'x',
      width: '1',
    };

    expect(modifiersGenerator(modifiers)).toBe('custom_option:x/w:1');
  });

  test('modifiersGenerator skips unknown names that could add path segments', () => {
    const modifiers: Record<string, string> = {
      'x:1/plain/https://example.com/a.jpg#': 'z',
      'w s': '1',
      '\u{17F}x': '1',
      width: '1',
    };

    expect(modifiersGenerator(modifiers)).toBe('w:1');
  });

  test('generateSignature', () => {
    expect(
      generateSignature(
        generateHmac(imgproxySecret, imgproxySalt),
        `/h:250/w:300/${encodedImageUrl}`,
      ),
    ).toBe('3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4');
  });

  test('generateSignature matches the imgproxy documentation example', () => {
    expect(
      generateSignature(
        generateHmac('736563726574', '68656C6C6F'),
        '/rs:fill:300:400:0/g:sm/aHR0cDovL2V4YW1w/bGUuY29tL2ltYWdl/cy9jdXJpb3NpdHku/anBn.png',
      ),
    ).toBe('oKfUtW34Dvo2BGQehJFR4Nr0_rIjOtdtzJ3QFsUcXH8');
  });

  test('generateHmac rejects a missing key like 1.0.1', () => {
    expect(() => generateHmac(undefined as unknown as string, 'aa')).toThrow(
      TypeError,
    );
  });

  test('generateHmac result can sign more than one path', () => {
    const hmac = generateHmac(imgproxySecret, imgproxySalt);
    const path = `/h:250/w:300/${encodedImageUrl}`;

    expect(generateSignature(hmac, '/w:1/abc')).not.toBe(
      generateSignature(hmac, path),
    );
    expect(generateSignature(hmac, path)).toBe(
      '3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4',
    );
  });

  test('getImageUrl', () => {
    expect(
      getImageUrl(imageUrl, {
        secret: imgproxySecret,
        salt: imgproxySalt,
        baseURL: '/imgproxy',
        modifiers: {
          width: '300',
          height: '250',
        },
      }),
    ).toBe(
      `/imgproxy/3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4/h:250/w:300/${encodedImageUrl}`,
    );
  });

  test.each([
    [undefined, '/3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4/h:250/w:300/'],
    ['', '3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4/h:250/w:300/'],
    [
      'https://imgproxy.example.com/',
      'https://imgproxy.example.com/3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4/h:250/w:300/',
    ],
  ])('getImageUrl joins baseURL %j', (baseURL, prefix) => {
    expect(
      getImageUrl(imageUrl, {
        secret: imgproxySecret,
        salt: imgproxySalt,
        baseURL,
        modifiers: { width: 300, height: 250 },
      }),
    ).toBe(prefix + encodedImageUrl);
  });

  test('getImageUrl works without modifiers and with switching keys', () => {
    const options = { secret: imgproxySecret, salt: imgproxySalt };

    expect(getImageUrl(imageUrl, { ...options, modifiers: {} })).toBe(
      `/BA_TVStk3DiBNKLLqG7sI_bSAqeZHp0qOkpCyXh7Q2o/${encodedImageUrl}`,
    );
    expect(
      getImageUrl(imageUrl, { ...options, salt: '00', modifiers: {} }),
    ).not.toBe(getImageUrl(imageUrl, { ...options, modifiers: {} }));
  });

  test('public types stay compatible with 1.x usage', () => {
    const legacyModifiers: Modifiers = { width: '300' };

    expectTypeOf(getImageUrl).parameter(1).toEqualTypeOf<ImageUrlOptions>();
    expectTypeOf<{
      secret: string;
      salt: string;
      baseURL?: string;
      modifiers: Modifiers;
    }>().toExtend<ImageUrlOptions>();
    expectTypeOf(modifiersGenerator).toBeCallableWith(legacyModifiers);
    expectTypeOf(legacyModifiers.width).toEqualTypeOf<string | undefined>();
  });
});
