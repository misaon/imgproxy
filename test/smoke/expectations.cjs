const assert = require('node:assert/strict');
const process = require('node:process');

const legacyExports = [
  'generateHmac',
  'generateSignature',
  'getImageUrl',
  'modifiersGenerator',
  'toBase64',
  'trimBase64',
];

const expectedUrl =
  '/imgproxy/3mqw14PjyZJLm2__0RNPEDZcX8NLtLZkURz1MfoCTm4/h:250/w:300/aHR0cHM6Ly9pbWcuZG9nLWxlYXJuLmNvbS9kb2ctYnJlZWRzL21hbHRlc2UvbWFsdGVzZS1zejUuanBn';

const verify = (library, label) => {
  for (const name of legacyExports) {
    assert.equal(typeof library[name], 'function', `${label}: ${name}`);
  }

  const url = library.getImageUrl(
    'https://img.dog-learn.com/dog-breeds/maltese/maltese-sz5.jpg',
    {
      secret: '6F787973686F70',
      salt: '10D16F7A61',
      baseURL: '/imgproxy',
      modifiers: { width: '300', height: 250 },
    },
  );

  assert.equal(url, expectedUrl, label);
  process.stdout.write(`ok ${label}\n`);
};

module.exports = { verify, nodeVersion: process.version };
