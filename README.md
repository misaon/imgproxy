# 🖼️ @misaon/imgproxy

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

> Generate [imgproxy](https://imgproxy.net/) url in browser and Node easily. Lightweight and Fast!

## Features

- 👌&nbsp; Zero configuration
- 🪄&nbsp; Modern, tiny and tree shaken code
- ⚙️&nbsp; Written in TypeScript
- 🕒&nbsp; Async-less methods and crypto computing
- 🚀&nbsp; Browser and Node support
- 📦&nbsp; Extendable and customizable
- 📰&nbsp; Compatible with the latest version of [imgproxy](https://imgproxy.net/)
- 🧪&nbsp; Covered by tests `>99%`

## Usage

Install package:

```sh
# npm
npm install @misaon/imgproxy

# yarn
yarn add @misaon/imgproxy

# pnpm
pnpm install @misaon/imgproxy
```

then in your code:

```js
import { getImageUrl } from '@misaon/imgproxy'
// or commonJS
// const { getImageUrl } = require("misaon/imgproxy");

const imageUrl = getImageUrl(sourceImageUrl, {
    baseURL: 'https://my-imgproxy.com', // optional
    secret: 'imgproxy-secret-key',
    salt: 'imgproxy-salt',
    modifiers: {
        width: '100',
        height: '75',
        // other modifiers... (see below)
    }
})

console.log(imageUrl)
```

### Modifiers
The list of modifiers that you can use is **well typed** and can be found [here](https://github.com/misaon/imgproxy/blob/9e7b8b56187c617a1d513469fcff80e7072f085d/src/index.ts#L11) or in [imgproxy docs](https://docs.imgproxy.net/generating_the_url?id=processing-options).

## Development

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

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
