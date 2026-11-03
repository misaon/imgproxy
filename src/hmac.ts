/* eslint-disable no-bitwise, unicorn/prefer-math-trunc -- SHA-256 relies on 32-bit wrapping arithmetic */

const BLOCK_SIZE = 64;
const ROUNDS = 64;
const DIGEST_SIZE = 32;
const PADDING_OVERHEAD = 9;
const UINT32_RANGE = 2 ** 32;

const ROUND_CONSTANTS = /* #__PURE__ */ Uint32Array.of(
  0x42_8a_2f_98,
  0x71_37_44_91,
  0xb5_c0_fb_cf,
  0xe9_b5_db_a5,
  0x39_56_c2_5b,
  0x59_f1_11_f1,
  0x92_3f_82_a4,
  0xab_1c_5e_d5,
  0xd8_07_aa_98,
  0x12_83_5b_01,
  0x24_31_85_be,
  0x55_0c_7d_c3,
  0x72_be_5d_74,
  0x80_de_b1_fe,
  0x9b_dc_06_a7,
  0xc1_9b_f1_74,
  0xe4_9b_69_c1,
  0xef_be_47_86,
  0x0f_c1_9d_c6,
  0x24_0c_a1_cc,
  0x2d_e9_2c_6f,
  0x4a_74_84_aa,
  0x5c_b0_a9_dc,
  0x76_f9_88_da,
  0x98_3e_51_52,
  0xa8_31_c6_6d,
  0xb0_03_27_c8,
  0xbf_59_7f_c7,
  0xc6_e0_0b_f3,
  0xd5_a7_91_47,
  0x06_ca_63_51,
  0x14_29_29_67,
  0x27_b7_0a_85,
  0x2e_1b_21_38,
  0x4d_2c_6d_fc,
  0x53_38_0d_13,
  0x65_0a_73_54,
  0x76_6a_0a_bb,
  0x81_c2_c9_2e,
  0x92_72_2c_85,
  0xa2_bf_e8_a1,
  0xa8_1a_66_4b,
  0xc2_4b_8b_70,
  0xc7_6c_51_a3,
  0xd1_92_e8_19,
  0xd6_99_06_24,
  0xf4_0e_35_85,
  0x10_6a_a0_70,
  0x19_a4_c1_16,
  0x1e_37_6c_08,
  0x27_48_77_4c,
  0x34_b0_bc_b5,
  0x39_1c_0c_b3,
  0x4e_d8_aa_4a,
  0x5b_9c_ca_4f,
  0x68_2e_6f_f3,
  0x74_8f_82_ee,
  0x78_a5_63_6f,
  0x84_c8_78_14,
  0x8c_c7_02_08,
  0x90_be_ff_fa,
  0xa4_50_6c_eb,
  0xbe_f9_a3_f7,
  0xc6_71_78_f2,
);

const INITIAL_STATE = /* #__PURE__ */ Uint32Array.of(
  0x6a_09_e6_67,
  0xbb_67_ae_85,
  0x3c_6e_f3_72,
  0xa5_4f_f5_3a,
  0x51_0e_52_7f,
  0x9b_05_68_8c,
  0x1f_83_d9_ab,
  0x5b_e0_cd_19,
);

const schedule = /* #__PURE__ */ new Uint32Array(ROUNDS);

const rotateRight = (value: number, bits: number): number =>
  (value >>> bits) | (value << (32 - bits));

const compress = (
  state: Uint32Array,
  block: Uint8Array,
  offset: number,
): void => {
  for (let index = 0, byte = offset; index < 16; index++, byte += 4) {
    schedule[index] =
      (block[byte] << 24) |
      (block[byte + 1] << 16) |
      (block[byte + 2] << 8) |
      block[byte + 3];
  }

  for (let index = 16; index < ROUNDS; index++) {
    const previous15 = schedule[index - 15];
    const previous2 = schedule[index - 2];
    const sigma0 =
      rotateRight(previous15, 7) ^
      rotateRight(previous15, 18) ^
      (previous15 >>> 3);
    const sigma1 =
      rotateRight(previous2, 17) ^
      rotateRight(previous2, 19) ^
      (previous2 >>> 10);
    schedule[index] =
      schedule[index - 16] + sigma0 + schedule[index - 7] + sigma1;
  }

  let a = state[0];
  let b = state[1];
  let c = state[2];
  let d = state[3];
  // eslint-disable-next-line unicorn/name-replacements -- FIPS 180-4 working variable name
  let e = state[4];
  let f = state[5];
  let g = state[6];
  let h = state[7];

  for (let index = 0; index < ROUNDS; index++) {
    const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
    const choice = (e & f) ^ (~e & g);
    const temporary1 =
      (h + sum1 + choice + ROUND_CONSTANTS[index] + schedule[index]) | 0;
    const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
    const majority = (a & b) ^ (a & c) ^ (b & c);
    const temporary2 = (sum0 + majority) | 0;
    h = g;
    g = f;
    f = e;
    e = (d + temporary1) | 0;
    d = c;
    c = b;
    b = a;
    a = (temporary1 + temporary2) | 0;
  }

  state[0] += a;
  state[1] += b;
  state[2] += c;
  state[3] += d;
  state[4] += e;
  state[5] += f;
  state[6] += g;
  state[7] += h;
};

const writeUint32 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = value >>> 24;
  target[offset + 1] = value >>> 16;
  target[offset + 2] = value >>> 8;
  target[offset + 3] = value;
};

const EMPTY = /* #__PURE__ */ new Uint8Array(0);

const finalize = (
  initialState: Uint32Array,
  processedBytes: number,
  head: Uint8Array,
  tail: Uint8Array = EMPTY,
): Uint8Array => {
  const dataLength = head.length + tail.length;
  const paddedLength =
    Math.ceil((dataLength + PADDING_OVERHEAD) / BLOCK_SIZE) * BLOCK_SIZE;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(head);
  buffer.set(tail, head.length);
  buffer[dataLength] = 0x80;

  const bitLength = (processedBytes + dataLength) * 8;
  writeUint32(buffer, paddedLength - 8, Math.floor(bitLength / UINT32_RANGE));
  writeUint32(buffer, paddedLength - 4, bitLength);

  const state = new Uint32Array(initialState);

  for (
    let blockOffset = 0;
    blockOffset < paddedLength;
    blockOffset += BLOCK_SIZE
  ) {
    compress(state, buffer, blockOffset);
  }

  const digest = new Uint8Array(DIGEST_SIZE);

  for (let index = 0; index < 8; index++) {
    writeUint32(digest, index * 4, state[index]);
  }

  return digest;
};

declare const hmacKeyBrand: unique symbol;

export type HmacKey = { readonly [hmacKeyBrand]: true };

type HmacState = {
  readonly innerState: Uint32Array;
  readonly outerState: Uint32Array;
  readonly pendingPrefix: Uint8Array;
  readonly processedBytes: number;
};

export const createHmacKey = (key: Uint8Array, prefix: Uint8Array): HmacKey => {
  const paddedKey = new Uint8Array(BLOCK_SIZE);
  paddedKey.set(
    key.length > BLOCK_SIZE ? finalize(INITIAL_STATE, 0, key) : key,
  );

  const innerPad = new Uint8Array(BLOCK_SIZE);
  const outerPad = new Uint8Array(BLOCK_SIZE);

  for (const [index, byte] of paddedKey.entries()) {
    innerPad[index] = byte ^ 0x36;
    outerPad[index] = byte ^ 0x5c;
  }

  const innerState = new Uint32Array(INITIAL_STATE);
  const outerState = new Uint32Array(INITIAL_STATE);
  compress(innerState, innerPad, 0);
  compress(outerState, outerPad, 0);

  const prefixBlocksLength = prefix.length - (prefix.length % BLOCK_SIZE);

  for (let offset = 0; offset < prefixBlocksLength; offset += BLOCK_SIZE) {
    compress(innerState, prefix, offset);
  }

  const state: HmacState = {
    innerState,
    outerState,
    pendingPrefix: prefix.subarray(prefixBlocksLength),
    processedBytes: BLOCK_SIZE + prefixBlocksLength,
  };

  return state as unknown as HmacKey;
};

export const signHmac = (key: HmacKey, message: Uint8Array): Uint8Array => {
  const state = key as unknown as HmacState;
  const innerDigest = finalize(
    state.innerState,
    state.processedBytes,
    state.pendingPrefix,
    message,
  );

  return finalize(state.outerState, BLOCK_SIZE, innerDigest);
};
