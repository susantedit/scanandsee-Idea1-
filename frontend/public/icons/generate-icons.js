/**
 * Run this once to generate all PWA icons from the SVG.
 * Requires sharp: npm install sharp -g  OR  node generate-icons.js from frontend/
 *
 * Usage: node public/icons/generate-icons.js
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG source — inline the icon so we don't need a file read
const svgBuffer = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#131315"/>
  <!-- Outer glow ring -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="#00e639" stroke-width="8" opacity="0.3"/>
  <!-- Scan lines -->
  <line x1="76" y1="256" x2="436" y2="256" stroke="#00eefc" stroke-width="3" opacity="0.4"/>
  <!-- Zap icon centered -->
  <path d="M280 96 L180 276 L248 276 L232 416 L332 236 L264 236 Z"
    fill="#00e639"
    stroke="#00ff41"
    stroke-width="4"
    stroke-linejoin="round"/>
  <!-- Corner brackets -->
  <path d="M96 156 L96 96 L156 96" fill="none" stroke="#00e639" stroke-width="12" stroke-linecap="round"/>
  <path d="M356 96 L416 96 L416 156" fill="none" stroke="#00e639" stroke-width="12" stroke-linecap="round"/>
  <path d="M96 356 L96 416 L156 416" fill="none" stroke="#00e639" stroke-width="12" stroke-linecap="round"/>
  <path d="M356 416 L416 416 L416 356" fill="none" stroke="#00e639" stroke-width="12" stroke-linecap="round"/>
</svg>
`);

async function generateIcons() {
  for (const size of SIZES) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(__dirname, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png`);
  }
  console.log('\nAll icons generated!');
}

generateIcons().catch(console.error);
