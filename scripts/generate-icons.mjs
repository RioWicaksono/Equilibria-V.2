// Generate PWA icons without external dependencies
// Uses zlib for PNG compression (built into Node.js)

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// PNG helper functions
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (const byte of data) {
    crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcData = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function createPng(width, height, pixelData) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT chunk - raw pixel data with filter byte per row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixelData[srcIdx];     // R
      rawData[dstIdx + 1] = pixelData[srcIdx + 1]; // G
      rawData[dstIdx + 2] = pixelData[srcIdx + 2]; // B
      rawData[dstIdx + 3] = pixelData[srcIdx + 3]; // A
    }
  }

  // Compress with deflate
  const compressed = deflateSync(rawData, { level: 9 });

  // IEND chunk
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', iend)
  ]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function generateIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const center = size / 2;
  const outerRadius = size * 0.48;
  const innerRadius = outerRadius - size * 0.03;
  const fontSize = size * 0.5;
  const borderWidth = size * 0.025;

  // Gradient colors from SVG
  const bgStart = hexToRgb('#0A0A0A');
  const bgEnd = hexToRgb('#1a1a1a');
  const textStart = hexToRgb('#faff04');
  const textEnd = hexToRgb('#2dd4bf');

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient
      const t = Math.min(1, dist / outerRadius);
      const bgR = lerp(bgStart[0], bgEnd[0], t);
      const bgG = lerp(bgStart[1], bgEnd[1], t);
      const bgB = lerp(bgStart[2], bgEnd[2], t);

      // Circle border
      const borderDist = Math.abs(dist - (outerRadius - borderWidth / 2));
      const borderIntensity = Math.max(0, 1 - borderDist / (borderWidth / 2));

      // Text gradient
      const textGradT = (x + y) / (size * 2);
      const textR = lerp(textStart[0], textEnd[0], textGradT);
      const textG = lerp(textStart[1], textEnd[1], textGradT);
      const textB = lerp(textStart[2], textEnd[2], textGradT);

      // E letter (simplified bounding box)
      const eLeft = center - fontSize * 0.35;
      const eRight = center + fontSize * 0.3;
      const eTop = center - fontSize * 0.4;
      const eBottom = center + fontSize * 0.35;

      const strokeWidth = size * 0.06;
      let isText = false;

      // E shape - vertical bar
      if (x >= eLeft && x <= eLeft + strokeWidth && y >= eTop && y <= eBottom) isText = true;
      // E shape - top horizontal
      if (y >= eTop && y <= eTop + strokeWidth && x >= eLeft && x <= eRight) isText = true;
      // E shape - middle horizontal
      const midY = center - strokeWidth * 0.2;
      if (y >= midY && y <= midY + strokeWidth && x >= eLeft && x <= eRight * 0.7) isText = true;
      // E shape - bottom horizontal
      if (y >= eBottom - strokeWidth && y <= eBottom && x >= eLeft && x <= eRight) isText = true;

      if (dist <= outerRadius) {
        if (isText) {
          pixels[idx] = textR;
          pixels[idx + 1] = textG;
          pixels[idx + 2] = textB;
          pixels[idx + 3] = 255;
        } else {
          pixels[idx] = bgR;
          pixels[idx + 1] = bgG;
          pixels[idx + 2] = bgB;
          pixels[idx + 3] = 255;
        }

        // Border overlay
        if (borderIntensity > 0 && !isText) {
          pixels[idx] = lerp(pixels[idx], textR, borderIntensity);
          pixels[idx + 1] = lerp(pixels[idx + 1], textG, borderIntensity);
          pixels[idx + 2] = lerp(pixels[idx + 2], textB, borderIntensity);
        }
      } else {
        // Transparent outside
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }

  return createPng(size, size, pixels);
}

// Generate icons
console.log('Generating PWA icons...\n');

const icon192 = generateIcon(192);
writeFileSync(join(rootDir, 'public', 'icon-192.png'), icon192);
console.log('✓ Created icon-192.png (192x192)');

const icon512 = generateIcon(512);
writeFileSync(join(rootDir, 'public', 'icon-512.png'), icon512);
console.log('✓ Created icon-512.png (512x512)');

console.log('\n✅ PWA icons generated successfully!');
