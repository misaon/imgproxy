/* eslint-disable @typescript-eslint/naming-convention */

import { joinURL } from 'ufo';
// @ts-expect-error crypto-es missing types
import { HMAC } from 'crypto-es/lib/hmac.js';
// @ts-expect-error crypto-es missing types
import { SHA256Algo } from 'crypto-es/lib/sha256.js';
// @ts-expect-error crypto-es missing types
import { Hex } from 'crypto-es/lib/core.js';
// @ts-expect-error crypto-es missing types
import { Base64 } from 'crypto-es/lib/enc-base64.js';

// @docs https://docs.imgproxy.net/generating_the_url?id=processing-options
export type Modifiers = {
	'min-height'?: string;
	'min-width'?: string;
	adjust?: string;
	auto_rotate?: string;
	autoquality?: string;
	background?: string;
	background_alpha?: string;
	blur?: string;
	blur_detections?: string;
	brightness?: string;
	cachebuster?: string;
	contrast?: string;
	crop?: string;
	disable_animation?: string;
	dpr?: string;
	draw_detections?: string;
	enforce_thumbnail?: string;
	enlarge?: string;
	expires?: string;
	extend?: string;
	fallback_image_url?: string;
	filename?: string;
	format?: string;
	format_quality?: string;
	gradient?: string;
	gravity?: string;
	height?: string;
	jpeg_options?: string;
	keep_copyright?: string;
	max_bytes?: string;
	padding?: string;
	page?: string;
	pixelate?: string;
	png_options?: string;
	preset?: string;
	quality?: string;
	raw?: string;
	resize?: string;
	resizing_algorithm?: string;
	resizing_type?: string;
	return_attachment?: string;
	rotate?: string;
	saturation?: string;
	sharpen?: string;
	size?: string;
	skip_processing?: string;
	strip_color_profile?: string;
	strip_metadata?: string;
	style?: string;
	trim?: string;
	unsharpening?: string;
	video_thumbnail_second?: string;
	watermark?: string;
	watermark_shadow?: string;
	watermark_size?: string;
	watermark_text?: string;
	watermark_url?: string;
	width?: string;
	zoom?: string;
};

const modifiersKeyMap: Modifiers = {
	'min-height': 'mh',
	'min-width': 'mw',
	adjust: 'a',
	auto_rotate: 'ar',
	autoquality: 'aq',
	background: 'bg',
	background_alpha: 'bga',
	blur: 'bl',
	blur_detections: 'bd',
	brightness: 'br',
	cachebuster: 'cb',
	contrast: 'co',
	crop: 'c',
	disable_animation: 'da',
	dpr: 'dpr',
	draw_detections: 'dd',
	enforce_thumbnail: 'eth',
	enlarge: 'el',
	expires: 'exp',
	extend: 'ex',
	fallback_image_url: 'fiu',
	filename: 'fn',
	format: 'f',
	format_quality: 'fq',
	gradient: 'gr',
	gravity: 'g',
	height: 'h',
	jpeg_options: 'jpgo',
	keep_copyright: 'kcr',
	max_bytes: 'mb',
	padding: 'pd',
	page: 'pg',
	pixelate: 'pix',
	png_options: 'pngo',
	preset: 'pr',
	quality: 'q',
	raw: 'raw',
	resize: 'rs',
	resizing_algorithm: 'ra',
	resizing_type: 'rt',
	return_attachment: 'att',
	rotate: 'rot',
	saturation: 'sa',
	sharpen: 'sh',
	size: 's',
	skip_processing: 'skp',
	strip_color_profile: 'scp',
	strip_metadata: 'sm',
	style: 'st',
	trim: 't',
	unsharpening: 'ush',
	video_thumbnail_second: 'vts',
	watermark: 'wm',
	watermark_shadow: 'wmsh',
	watermark_size: 'wms',
	watermark_text: 'wmt',
	watermark_url: 'wmu',
	width: 'w',
	zoom: 'z',
};

const isBrowser = typeof window !== 'undefined';

export const toBase64 = (value: string) =>
	isBrowser
		? window.btoa(value)
		: Buffer.from(value, 'binary').toString('base64');

export const trimBase64 = (value: string) =>
	value.replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');

export const generateHmac = (secret: string, salt: string) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
	const hmac = HMAC.create(SHA256Algo, Hex.parse(secret));
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	hmac.update(Hex.parse(salt));

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return hmac;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateSignature = (hmac: any, path: string): string => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
	const hash = Base64.stringify(hmac.finalize(path));

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	return trimBase64(hash);
};

export const modifiersGenerator = (modifiers: Modifiers) =>
	// eslint-disable-next-line @typescript-eslint/require-array-sort-compare
	Object.entries(Object.fromEntries(Object.entries(modifiers).sort()))
		.map(
			modifier =>
				`${(modifiersKeyMap as Record<string, string>)[modifier[0]]}:${
					modifier[1]
				}`,
		)
		.join('/');

export function getImageUrl(
	imageSource: string,
	options: {
		secret: string;
		salt: string;
		baseURL?: string;
		modifiers: Modifiers;
	},
) {
	const encodedUrl = trimBase64(toBase64(imageSource));
	const operations = modifiersGenerator(options.modifiers);
	const encodedUrlWithModifiers = joinURL('/', operations, encodedUrl);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const hmac = generateHmac(options.secret, options.salt);
	const signature = generateSignature(hmac, encodedUrlWithModifiers);

	return joinURL(options.baseURL ?? '/', signature, encodedUrlWithModifiers);
}
