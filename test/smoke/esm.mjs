import { createRequire } from 'node:module';
import * as library from '@misaon/imgproxy';

const { verify, nodeVersion } = createRequire(import.meta.url)(
  './expectations.cjs',
);

verify(library, `import on Node.js ${nodeVersion}`);
