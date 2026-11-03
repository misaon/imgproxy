const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { verify, nodeVersion } = require('./expectations.cjs');

verify(require('@misaon/imgproxy'), `require() on Node.js ${nodeVersion}`);

const sandbox = { module: { exports: {} } };
sandbox.exports = sandbox.module.exports;
runInNewContext(
  readFileSync(require.resolve('@misaon/imgproxy'), 'utf8'),
  sandbox,
);
verify(sandbox.module.exports, 'runtime without Node.js or DOM globals');
