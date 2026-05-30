// ── Generate Extension Icons ─────────────────────
// Run: node extension/generate-icons.mjs
// Creates PNG icons from canvas

import { writeFileSync } from 'fs';
import { createCanvas } from 'canvas';

const sizes = [16, 48, 128];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const radius = Math.round(size * 0.15);
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fillStyle = '#e8ff5a';
  ctx.fill();

  // Letter "F"
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.round(size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('F', size / 2, size / 2 + 1);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`extension/icons/icon${size}.png`, buffer);
  console.log(`Generated icon${size}.png`);
}
