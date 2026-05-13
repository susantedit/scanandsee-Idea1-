import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT = 'D:/scanandsee/frontend/public/icons';
mkdirSync(OUT, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#131315"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#00e639" stroke-width="6" opacity="0.2"/>
  <path d="M280 96 L180 276 L248 276 L232 416 L332 236 L264 236 Z"
    fill="#00e639" stroke="#00ff41" stroke-width="4" stroke-linejoin="round"/>
  <path d="M96 156 L96 96 L156 96" fill="none" stroke="#00e639" stroke-width="14" stroke-linecap="round"/>
  <path d="M356 96 L416 96 L416 156" fill="none" stroke="#00e639" stroke-width="14" stroke-linecap="round"/>
  <path d="M96 356 L96 416 L156 416" fill="none" stroke="#00e639" stroke-width="14" stroke-linecap="round"/>
  <path d="M356 416 L416 416 L416 356" fill="none" stroke="#00e639" stroke-width="14" stroke-linecap="round"/>
</svg>`);

for (const size of SIZES) {
  await sharp(svg).resize(size, size).png().toFile(join(OUT, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}
console.log('\nAll icons generated!');
