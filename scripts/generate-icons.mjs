import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0a0e1a"/>
    </linearGradient>
    <linearGradient id="page" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fcd34d"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="pageR" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
    <linearGradient id="spine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="55%" r="42%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Ambient glow -->
  <ellipse cx="256" cy="280" rx="210" ry="190" fill="url(#glow)"/>

  <!-- Book group with shadow -->
  <g filter="url(#shadow)">
    <!-- Left page -->
    <path d="M 90,152 L 244,163 L 244,368 L 90,379 Z" fill="url(#page)"/>

    <!-- Lines on left page -->
    <g stroke="#0c0f1e" stroke-linecap="round" opacity="0.22">
      <line x1="114" y1="200" x2="224" y2="194" stroke-width="9"/>
      <line x1="114" y1="226" x2="224" y2="220" stroke-width="9"/>
      <line x1="114" y1="252" x2="224" y2="246" stroke-width="9"/>
      <line x1="114" y1="278" x2="224" y2="272" stroke-width="9"/>
      <line x1="114" y1="304" x2="178" y2="300" stroke-width="9"/>
    </g>

    <!-- Spine -->
    <path d="M 244,163 Q 256,146 268,163 L 268,368 Q 256,385 244,368 Z" fill="url(#spine)"/>

    <!-- Right page -->
    <path d="M 268,163 L 422,152 L 422,379 L 268,368 Z" fill="url(#pageR)"/>

    <!-- Lines on right page -->
    <g stroke="#0c0f1e" stroke-linecap="round" opacity="0.22">
      <line x1="288" y1="194" x2="398" y2="200" stroke-width="9"/>
      <line x1="288" y1="220" x2="398" y2="226" stroke-width="9"/>
      <line x1="288" y1="246" x2="398" y2="252" stroke-width="9"/>
      <line x1="288" y1="272" x2="398" y2="278" stroke-width="9"/>
      <line x1="288" y1="300" x2="352" y2="304" stroke-width="9"/>
    </g>
  </g>

  <!-- Bookmark ribbon on right page -->
  <path d="M 378,152 L 406,152 L 406,224 L 392,210 L 378,224 Z" fill="#f59e0b" opacity="0.95"/>
  <path d="M 378,152 L 406,152 L 406,224 L 392,210 L 378,224 Z"
        fill="none" stroke="#92400e" stroke-width="2" opacity="0.5"/>
</svg>`;

await sharp(Buffer.from(svg)).resize(512, 512).png({ compressionLevel: 9 }).toFile(join(outDir, "icon-512.png"));
await sharp(Buffer.from(svg)).resize(192, 192).png({ compressionLevel: 9 }).toFile(join(outDir, "icon-192.png"));

console.log("Generated icon-512.png and icon-192.png");
