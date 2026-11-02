export const MAX_DIMENSION = 10000;

export function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getExtension(mime) {
  return { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime] || 'png';
}

export function getFormatLabel(mime) {
  return {
    'image/png': 'PNG', 'image/jpeg': 'JPEG', 'image/webp': 'WebP',
    'image/gif': 'GIF', 'image/bmp': 'BMP',
  }[mime] || 'IMG';
}

export function getOutputMime(outputFormat, originalMime) {
  if (outputFormat === 'original') {
    return ['image/jpeg', 'image/webp', 'image/png'].includes(originalMime)
      ? originalMime
      : 'image/png';
  }
  return outputFormat;
}

export function isSideways(rotation) {
  return rotation === 90 || rotation === 270;
}

export function fitDimensions(w, h) {
  const shrink = Math.min(1, MAX_DIMENSION / Math.max(w, h));
  return {
    w: Math.max(1, Math.round(w * shrink)),
    h: Math.max(1, Math.round(h * shrink)),
  };
}

export function getSourceDims(state) {
  return isSideways(state.rotation)
    ? { w: state.cropH, h: state.cropW }
    : { w: state.cropW, h: state.cropH };
}

export function drawTransformed(canvas, w, h, state, mime) {
  const ctx = canvas.getContext('2d');
  canvas.width = w;
  canvas.height = h;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(state.rotation * Math.PI / 180);
  ctx.scale(state.flippedH ? -1 : 1, state.flippedV ? -1 : 1);

  let dw = w, dh = h;
  if (isSideways(state.rotation)) { dw = h; dh = w; }

  ctx.drawImage(
    state.originalImage,
    state.cropX, state.cropY, state.cropW, state.cropH,
    -dw / 2, -dh / 2, dw, dh
  );
  ctx.restore();
}

export function processImage(canvas, state, mime, quality) {
  const w = Math.max(1, Math.round(state.targetWidth));
  const h = Math.max(1, Math.round(state.targetHeight));
  drawTransformed(canvas, w, h, state, mime);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality / 100);
  });
}

export async function autoAdjustQuality(state, mime, targetSize) {
  if (mime === 'image/png') {
    return { quality: 100, blob: null, hit: false, message: 'PNG is lossless — use JPG/WebP' };
  }

  const w = Math.max(1, Math.round(state.targetWidth));
  const h = Math.max(1, Math.round(state.targetHeight));
  const tmp = document.createElement('canvas');
  drawTransformed(tmp, w, h, state, mime);

  let lo = 1, hi = 100, best = 1;
  for (let i = 0; i < 8 && lo <= hi; i++) {
    const mid = Math.round((lo + hi) / 2);
    const blob = await new Promise((r) => tmp.toBlob(r, mime, mid / 100));
    if (blob.size <= targetSize) { best = mid; lo = mid + 1; }
    else { hi = mid - 1; }
  }

  const finalBlob = await new Promise((r) => tmp.toBlob(r, mime, best / 100));
  const hit = finalBlob.size <= targetSize;

  return {
    quality: best,
    blob: finalBlob,
    hit,
    message: hit
      ? `${formatBytes(finalBlob.size)} at quality ${best}`
      : `${formatBytes(finalBlob.size)} — reduce dimensions`,
  };
}
