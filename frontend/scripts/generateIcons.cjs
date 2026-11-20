// scripts/generateIcons.js
// Run once: node scripts/generateIcons.js
// Generates all required PWA icon sizes in public/icons/
// Requires: npm install sharp  (run in frontend folder)

const sharp = require('sharp')
const path  = require('path')
const fs    = require('fs')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const OUT   = path.join(__dirname, '../public/icons')

// Create output folder
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

// HealthCore icon SVG — teal heart with gradient background
const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a1628"/>
      <stop offset="100%" style="stop-color:#0d2444"/>
    </linearGradient>
    <linearGradient id="heart" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d9488"/>
      <stop offset="100%" style="stop-color:#0891b2"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <!-- Heart shape -->
  <path d="M256 390 C256 390 120 300 120 200 C120 155 155 130 190 130 C216 130 240 145 256 168 C272 145 296 130 322 130 C357 130 392 155 392 200 C392 300 256 390 256 390Z"
        fill="url(#heart)" opacity="0.95"/>
  <!-- Pulse line -->
  <polyline points="156,256 196,256 216,210 236,302 256,230 276,256 316,256 336,256"
            fill="none" stroke="white" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
</svg>
`

const generate = async () => {
  const svgBuf = Buffer.from(SVG)
  for (const size of SIZES) {
    await sharp(svgBuf)
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`))
    console.log(`✅ icon-${size}.png`)
  }
  console.log('\nAll icons generated in public/icons/')
}

generate().catch(console.error)