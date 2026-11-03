/* eslint-disable no-bitwise -- CRC-32 for the PNG fixture */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { deflateSync } from 'node:zlib';
import { type TestProject } from 'vitest/node';

export type KeyPair = { label: string; secret: string; salt: string };

export type ImgproxyContext = {
  baseUrl: string;
  sourceBase: string;
  pairs: KeyPair[];
};

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Vitest extends ProvidedContext through declaration merging
  export interface ProvidedContext {
    imgproxy: ImgproxyContext;
  }
}

export const FIXTURE_WIDTH = 400;
export const FIXTURE_HEIGHT = 300;
const FIXTURE_NAMES = new Set(['dog.png', 'obrázek-řeřicha.png']);

const image = process.env.IMGPROXY_IMAGE ?? 'ghcr.io/imgproxy/imgproxy:v4';

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;

  for (let bit = 0; bit < 8; bit++) {
    crc = (crc & 1) === 1 ? 0xed_b8_83_20 ^ (crc >>> 1) : crc >>> 1;
  }

  return crc >>> 0;
});

const crc32 = (data: Uint8Array): number => {
  let crc = 0xff_ff_ff_ff;

  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xff_ff_ff_ff) >>> 0;
};

const concat = (parts: Uint8Array[]): Uint8Array => {
  const result = new Uint8Array(
    parts.reduce((length, part) => length + part.length, 0),
  );
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
};

const uint32 = (value: number): Uint8Array => {
  const bytes = new Uint8Array(4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, value);

  return bytes;
};

const textEncoder = new TextEncoder();

const pngChunk = (type: string, data: Uint8Array): Uint8Array => {
  const body = concat([textEncoder.encode(type), data]);

  return concat([uint32(data.length), body, uint32(crc32(body))]);
};

const createPng = (width: number, height: number): Uint8Array => {
  const header = concat([
    uint32(width),
    uint32(height),
    Uint8Array.of(8, 2, 0, 0, 0),
  ]);
  const rowLength = width * 3 + 1;
  const pixels = new Uint8Array(rowLength * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = y * rowLength + 1 + x * 3;
      pixels[offset] = Math.floor((x * 255) / width);
      pixels[offset + 1] = Math.floor((y * 255) / height);
      pixels[offset + 2] = 128;
    }
  }

  return concat([
    Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixels)),
    pngChunk('IEND', new Uint8Array(0)),
  ]);
};

const decodePath = (url = '/'): string => {
  try {
    const { pathname } = new URL(url, 'http://fixture');

    return decodeURIComponent(pathname.slice(1));
  } catch {
    return '';
  }
};

const startFixtureServer = async () => {
  const png = createPng(FIXTURE_WIDTH, FIXTURE_HEIGHT);
  const server = createServer((request, response) => {
    if (FIXTURE_NAMES.has(decodePath(request.url))) {
      response.writeHead(200, { 'content-type': 'image/png' }).end(png);
    } else {
      response.writeHead(404).end();
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '0.0.0.0', resolve);
  });

  return server;
};

const docker = (...arguments_: string[]): string =>
  execFileSync('docker', arguments_, { encoding: 'utf8' }).trim();

const isHealthy = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url);

    return response.ok;
  } catch {
    return false;
  }
};

const waitForHealth = async (baseUrl: string): Promise<void> => {
  for (let attempt = 0; attempt < 60; attempt++) {
    // eslint-disable-next-line no-await-in-loop -- polling a local container until it is ready
    if (await isHealthy(`${baseUrl}/health`)) {
      return;
    }

    // eslint-disable-next-line no-await-in-loop -- polling a local container until it is ready
    await delay(500);
  }

  throw new Error(`imgproxy at ${baseUrl} did not become healthy`);
};

const hex = (bytes: number): string =>
  // eslint-disable-next-line unicorn/prefer-uint8array-hex -- Uint8Array#toHex() is not in Node.js 24
  randomBytes(bytes).toString('hex');

export default async function setup(project: TestProject): Promise<() => void> {
  const pairs: KeyPair[] = [
    { label: 'short key', secret: hex(32), salt: hex(16) },
    { label: 'long key and salt', secret: hex(100), salt: hex(70) },
  ];
  const server = await startFixtureServer();
  const { port } = server.address() as AddressInfo;
  const container = docker(
    'run',
    '--detach',
    '--rm',
    '--publish',
    '127.0.0.1::8080',
    '--add-host',
    'host.docker.internal:host-gateway',
    '--env',
    `IMGPROXY_KEY=${pairs.map((pair) => pair.secret).join(',')}`,
    '--env',
    `IMGPROXY_SALT=${pairs.map((pair) => pair.salt).join(',')}`,
    '--env',
    'IMGPROXY_ALLOW_PRIVATE_SOURCE_ADDRESSES=true',
    image,
  );
  const stop = () => {
    docker('rm', '--force', container);
    server.close();
  };

  try {
    const baseUrl = `http://${docker('port', container, '8080/tcp').split('\n', 1)[0]}`;
    await waitForHealth(baseUrl);
    project.provide('imgproxy', {
      baseUrl,
      sourceBase: `http://host.docker.internal:${port}`,
      pairs,
    });
  } catch (error) {
    stop();
    throw error;
  }

  return stop;
}
