import { expect, describe, test } from 'vitest';
import {
  toBase64,
  trimBase64,
  modifiersGenerator,
  generateSignature,
  generateHmac,
  getImageUrl,
} from '../src';

const imgproxySecret = '6F787973686F70';
const imgproxySalt = '10D16F7A61';
const imageUrl = 'https://img.dog-learn.com/dog-breeds/maltese/maltese-sz5.jpg';

describe('@misaon/imgproxy', () => {
  test('toBase64', () => {
    expect(toBase64(imageUrl)).toBe(
      'aHR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9kb2ctYnJlZWRzL21hbHRlc2UvbWFsdGVzZS1zejUuanBn'
    );
  });

  test('trimBase64', () => {
    expect(
      trimBase64(
        'a=HR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9k+b2ctYnJlZWRzL21hbHRlc2U/bWFsdGVzZS1zejUuanBn'
      )
    ).toBe(
      'aHR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9k-b2ctYnJlZWRzL21hbHRlc2U_bWFsdGVzZS1zejUuanBn'
    );
  });

  test('modifiersGenerator', () => {
    expect(modifiersGenerator({ width: '768', height: '0' })).toBe('h:0/w:768');
  });

  test('generateSignature', () => {
    expect(
      generateSignature(
        generateHmac(imgproxySecret, imgproxySalt),
        '/h:250/w:300/aHR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9kb2ctYnJlZWRzL21hbHRlc2UvbWFsdGVzZS1zejUuanBn'
      )
    ).toBe('3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4');
  });

  test('getImageUrl', () => {
    expect(
      getImageUrl(imageUrl, {
        secret: imgproxySecret,
        salt: imgproxySalt,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        baseURL: '/imgproxy',
        modifiers: {
          width: '300',
          height: '250',
        },
      })
    ).toBe(
      '/imgproxy/3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4/h:250/w:300/aHR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9kb2ctYnJlZWRzL21hbHRlc2UvbWFsdGVzZS1zejUuanBn'
    );
  });
});
