# 🖼️ @misaon/imgproxy

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Generate signed [imgproxy](https://imgproxy.net/) URLs in the **browser, Node.js and edge runtimes**. Lightweight and fast!

## Features

- 👌&nbsp; Zero configuration
- 📦&nbsp; Zero dependencies, under 3 kB minified and gzipped
- ⚙️&nbsp; Written in TypeScript, with typed modifiers for every imgproxy processing option
- 🕒&nbsp; Synchronous API, including the HMAC signature
- 🚀&nbsp; No runtime globals needed: browsers, Node.js 16+, Deno, Bun, Cloudflare Workers
- 🔀&nbsp; ESM and CommonJS builds
- 📰&nbsp; Compatible with the latest version of [imgproxy](https://imgproxy.net/)
- 🧪&nbsp; 100% test coverage, signatures checked against `node:crypto`

## Usage

Install package:

```sh
# npm
npm install @misaon/imgproxy

# yarn
yarn add @misaon/imgproxy

# pnpm
pnpm add @misaon/imgproxy
```

then in your code:

```js
import { getImageUrl } from '@misaon/imgproxy';

const imageUrl = getImageUrl('https://example.com/my-image.jpg', {
  baseURL: 'https://my-imgproxy.com', // optional
  secret: '736563726574', // hex encoded, same as IMGPROXY_KEY
  salt: '68656C6C6F', // hex encoded, same as IMGPROXY_SALT
  modifiers: {
    width: 100,
    height: 75,
    resize: ['fill', 100, 75],
    // other modifiers... (see below)
  },
});

console.log(imageUrl);
```

That's all! 🥂

---

If you use **CommonJS**, you can require it like this:

```js
const { getImageUrl } = require('@misaon/imgproxy');
```

### Modifiers

Modifiers use the full option names from the [imgproxy docs](https://docs.imgproxy.net/usage/processing#processing-options) and are converted to their short form in the URL (`width` becomes `w`, `resize` becomes `rs`). The complete, typed list is in [`src/modifiers.ts`](https://github.com/misaon/imgproxy/blob/main/src/modifiers.ts).

A value can be a string, number, boolean or an array. Array items are joined with `:`, so `resize: ['fit', 300, 200]` becomes `rs:fit:300:200`.

`undefined` and `null` are written into the URL as text, the same as in 1.0.1. imgproxy then rejects the URL, so a missing value such as `expires` cannot quietly produce a URL that never expires. Leave optional modifiers out instead:

```js
getImageUrl(source, {
  secret,
  salt,
  modifiers: {
    format: 'webp',
    ...(props.width !== undefined && { width: props.width }),
  },
});
```

Modifiers are always sorted by name, so the same options produce the same URL and signature.

Values go into the signed path as they are. Validate anything that comes from user input before you pass it in: a value containing `/` can add processing options or even change which source URL the signature covers.

#### Custom modifiers

Names the library does not know are passed to imgproxy unchanged, as long as they contain only letters, digits, `_` and `-` and start with a letter. Other names are skipped, so a key from user input cannot add path segments. In TypeScript, add custom names to the `Modifiers` interface:

```ts
declare module '@misaon/imgproxy' {
  interface Modifiers {
    my_preset_option?: string;
  }
}
```

### Lower-level helpers

`getImageUrl` covers the common case and caches the derived signing key between calls. When you build the path yourself, sign it with the helpers:

```js
import { generateHmac, generateSignature } from '@misaon/imgproxy';

const hmac = generateHmac(secret, salt); // reusable for any number of paths
const signature = generateSignature(
  hmac,
  '/rs:fill:300:400/g:sm/plain/https://example.com/image.jpg',
);
```

`modifiersGenerator`, `toBase64` and `trimBase64` are exported as well.

## Upgrading from 1.0

The public API is unchanged, and URLs built from ASCII sources with valid hex keys are byte for byte the same as in 1.0.1. A few edge cases now behave differently:

- Source URLs with non-ASCII characters are encoded as UTF-8, as imgproxy expects. 1.0.1 used Latin-1, which broke characters above U+00FF. URLs with such characters change once, so a CDN in front of imgproxy caches them again.
- `generateHmac` returns an opaque key for `generateSignature`, which you can reuse for any number of paths. It used to return a crypto-es object.
- Unknown modifier names now reach imgproxy (they used to become `undefined:`), but only names made of letters, digits, `_` and `-`.
- Array values are joined with `:`. 1.0.1 joined them with `,`.
- A source that is not a string is converted with `String()` in every runtime. 1.0.1 threw in Node.js and encoded the text in browsers.
- Secrets or salts that are not valid hex can give a different signature than before. imgproxy rejects such keys, so this only affects servers that run without signature checks.

## Development

- Clone this repository
- Install [Node.js](https://nodejs.org/en/) 22.18 or newer (the current LTS is recommended)
- Install [pnpm](https://pnpm.io/installation), for example with `npm install --global pnpm`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`
- Run all checks using `pnpm test` and build the package using `pnpm build`

## License

Made with 🧡 by [@misaon](https://github.com/misaon)

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@misaon/imgproxy?style=flat-square
[npm-version-href]: https://npmjs.com/package/@misaon/imgproxy
[npm-downloads-src]: https://img.shields.io/npm/dm/@misaon/imgproxy?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@misaon/imgproxy
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/misaon/imgproxy/ci.yml?branch=main&style=flat-square
[github-actions-href]: https://github.com/misaon/imgproxy/actions?query=workflow%3Aci
[codecov-src]: https://img.shields.io/codecov/c/gh/misaon/imgproxy/main?style=flat-square
[codecov-href]: https://codecov.io/gh/misaon/imgproxy
