import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { UA, hash } from './util.js';

const EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

// Download a remote image into imagesDir and return the app-relative path
// ("data/images/<hash>.<ext>"), or null on failure / too large.
// We prefer fetching already-small image variants (thumbnails) rather than
// resizing here, so the Scout stays dependency-free.
export async function cacheImage(remoteUrl, imagesDir, { timeout = 20000, maxBytes = 5_000_000 } = {}) {
  if (!remoteUrl) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(remoteUrl, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const ext = EXT[type] || 'jpg';
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) return null; // too big for the offline cache
    const name = `${hash(remoteUrl)}.${ext}`;
    await mkdir(imagesDir, { recursive: true });
    await writeFile(path.join(imagesDir, name), buf);
    return `data/images/${name}`;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
