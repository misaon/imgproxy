/* eslint-disable @typescript-eslint/naming-convention -- imgproxy option names */

// @docs https://docs.imgproxy.net/usage/processing#processing-options
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- consumers may augment it via declaration merging
export interface Modifiers {
  'min-height'?: string;
  'min-width'?: string;
  adjust?: string;
  auto_rotate?: string;
  autoquality?: string;
  avif_options?: string;
  background?: string;
  background_alpha?: string;
  blur?: string;
  blur_areas?: string;
  blur_detections?: string;
  brightness?: string;
  bypass_cache?: string;
  cache_tags?: string;
  cachebuster?: string;
  color_profile?: string;
  colorize?: string;
  contrast?: string;
  crop?: string;
  crop_aspect_ratio?: string;
  crop_objects?: string;
  disable_animation?: string;
  dpi?: string;
  dpr?: string;
  draw_detections?: string;
  duotone?: string;
  enforce_thumbnail?: string;
  enlarge?: string;
  expires?: string;
  extend?: string;
  extend_aspect_ratio?: string;
  fallback_image_url?: string;
  filename?: string;
  flip?: string;
  format?: string;
  format_quality?: string;
  gradient?: string;
  gravity?: string;
  hashsum?: string;
  height?: string;
  jpeg_options?: string;
  keep_copyright?: string;
  max_animation_frame_resolution?: string;
  max_animation_frames?: string;
  max_bytes?: string;
  max_result_dimension?: string;
  max_src_file_size?: string;
  max_src_resolution?: string;
  monochrome?: string;
  objects_position?: string;
  padding?: string;
  page?: string;
  pages?: string;
  pixelate?: string;
  png_options?: string;
  preserve_hdr?: string;
  preset?: string;
  progressive_blur?: string;
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
  unsharp_masking?: string;
  /**
  @deprecated Use `unsharp_masking` instead.
  */
  unsharpening?: string;
  video_thumbnail_animation?: string;
  video_thumbnail_keyframes?: string;
  video_thumbnail_second?: string;
  video_thumbnail_tile?: string;
  watermark?: string;
  watermark_rotate?: string;
  watermark_shadow?: string;
  watermark_size?: string;
  watermark_text?: string;
  watermark_url?: string;
  webp_options?: string;
  width?: string;
  zoom?: string;
}

export type ModifierPrimitive = string | number | boolean;

export type ModifierValue = ModifierPrimitive | readonly ModifierPrimitive[];

export type ModifierOptions = {
  [Name in keyof Modifiers]?: ModifierValue | undefined;
};

const shortNames = /* #__PURE__ */ new Map<string, string>(
  Object.entries({
    'min-height': 'mh',
    'min-width': 'mw',
    adjust: 'a',
    auto_rotate: 'ar',
    autoquality: 'aq',
    avif_options: 'avifo',
    background: 'bg',
    background_alpha: 'bga',
    blur: 'bl',
    blur_areas: 'ba',
    blur_detections: 'bd',
    brightness: 'br',
    bypass_cache: 'bc',
    cache_tags: 'ct',
    cachebuster: 'cb',
    color_profile: 'cp',
    colorize: 'col',
    contrast: 'co',
    crop: 'c',
    crop_aspect_ratio: 'car',
    crop_objects: 'c_obj',
    disable_animation: 'da',
    dpi: 'dpi',
    dpr: 'dpr',
    draw_detections: 'dd',
    duotone: 'dt',
    enforce_thumbnail: 'eth',
    enlarge: 'el',
    expires: 'exp',
    extend: 'ex',
    extend_aspect_ratio: 'exar',
    fallback_image_url: 'fiu',
    filename: 'fn',
    flip: 'fl',
    format: 'f',
    format_quality: 'fq',
    gradient: 'gr',
    gravity: 'g',
    hashsum: 'hs',
    height: 'h',
    jpeg_options: 'jpgo',
    keep_copyright: 'kcr',
    max_animation_frame_resolution: 'mafr',
    max_animation_frames: 'maf',
    max_bytes: 'mb',
    max_result_dimension: 'mrd',
    max_src_file_size: 'msfs',
    max_src_resolution: 'msr',
    monochrome: 'mc',
    objects_position: 'op',
    padding: 'pd',
    page: 'pg',
    pages: 'pgs',
    pixelate: 'pix',
    png_options: 'pngo',
    preserve_hdr: 'ph',
    preset: 'pr',
    progressive_blur: 'pbl',
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
    unsharp_masking: 'ush',
    unsharpening: 'ush',
    video_thumbnail_animation: 'vta',
    video_thumbnail_keyframes: 'vtk',
    video_thumbnail_second: 'vts',
    video_thumbnail_tile: 'vtt',
    watermark: 'wm',
    watermark_rotate: 'wmr',
    watermark_shadow: 'wmsh',
    watermark_size: 'wms',
    watermark_text: 'wmt',
    watermark_url: 'wmu',
    webp_options: 'webpo',
    width: 'w',
    zoom: 'z',
  } satisfies Record<keyof Modifiers, string>),
);

// eslint-disable-next-line require-unicode-regexp -- the v flag needs ES2024; the build targets ES2020
const customName = /^[A-Za-z][\w-]*$/u;

const formatValue = (value: unknown): string =>
  Array.isArray(value) ? value.join(':') : String(value);

export const modifiersGenerator = (modifiers: ModifierOptions): string => {
  const values: Record<string, unknown> = modifiers;
  const operations: string[] = [];

  // eslint-disable-next-line unicorn/no-array-sort, unicorn/require-array-sort-compare -- keeps the 1.x code-unit order; toSorted() needs ES2023
  for (const name of Object.keys(values).sort()) {
    const shortName =
      shortNames.get(name) ?? (customName.test(name) ? name : undefined);

    if (shortName !== undefined) {
      operations.push(`${shortName}:${formatValue(values[name])}`);
    }
  }

  return operations.join('/');
};
