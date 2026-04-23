import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pub = (p) => resolve(process.cwd(), 'public', p)

const tasks = [
  { src: 'icon-512.svg', out: 'icon-192.png', size: 192 },
  { src: 'icon-512.svg', out: 'icon-512.png', size: 512 },
  { src: 'icon-maskable-512.svg', out: 'icon-maskable-192.png', size: 192 },
  { src: 'icon-maskable-512.svg', out: 'icon-maskable-512.png', size: 512 },
]

for (const t of tasks) {
  const svg = readFileSync(pub(t.src))
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(pub(t.out))
  console.log('✓', t.out)
}
