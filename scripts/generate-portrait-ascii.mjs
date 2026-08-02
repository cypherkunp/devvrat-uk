// Renders public/portrait.jpg into the ASCII grid the Identity shows instead
// of a photo. Run with `node scripts/generate-portrait-ascii.mjs`.
//
// sips ships with macOS and is the only image decoder available here; it
// resamples straight to an uncompressed 24-bit BMP, which is trivial to read.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const source = 'public/portrait.jpg'
const target = 'src/link-hub/portrait-ascii.ts'

const columns = 78
// Monospace cells are about twice as tall as they are wide.
const rows = Math.round((columns / 2) * 1.06)

/** Sparse to dense. The subject is dark, so density tracks darkness. */
const ramp = ' .`,:;~=+*csvxo#%@'

function decode(path) {
  const bmp = readFileSync(path)
  const offset = bmp.readUInt32LE(10)
  const width = bmp.readInt32LE(18)
  const height = bmp.readInt32LE(22)
  const bitsPerPixel = bmp.readUInt16LE(28)

  if (bitsPerPixel !== 24)
    throw new Error(`expected 24bpp, got ${bitsPerPixel}`)

  const topDown = height < 0
  const h = Math.abs(height)
  const stride = Math.ceil((width * 3) / 4) * 4
  const luma = new Float64Array(width * h)

  for (let y = 0; y < h; y += 1) {
    const row = offset + (topDown ? y : h - 1 - y) * stride
    for (let x = 0; x < width; x += 1) {
      const p = row + x * 3
      luma[y * width + x] =
        (0.114 * bmp[p] + 0.587 * bmp[p + 1] + 0.299 * bmp[p + 2]) / 255
    }
  }

  return { width, height: h, luma }
}

/** Stretch the histogram so the wall clips to empty and the shirt to solid. */
function normalise(luma, lowPercentile = 0.02, highPercentile = 0.96) {
  const sorted = Float64Array.from(luma).sort()
  const low = sorted[Math.floor(sorted.length * lowPercentile)]
  const high = sorted[Math.floor(sorted.length * highPercentile)]
  const span = Math.max(high - low, 1e-6)

  return luma.map((value) => Math.min(1, Math.max(0, (value - low) / span)))
}

function boxBlur(luma, width, height, radius) {
  const pass = (input, w, h) => {
    const out = new Float64Array(input.length)
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let sum = 0
        let count = 0
        for (let k = -radius; k <= radius; k += 1) {
          const sx = Math.min(w - 1, Math.max(0, x + k))
          sum += input[y * w + sx]
          count += 1
        }
        out[y * w + x] = sum / count
      }
    }
    return out
  }

  const transpose = (input, w, h) => {
    const out = new Float64Array(input.length)
    for (let y = 0; y < h; y += 1)
      for (let x = 0; x < w; x += 1) out[x * h + y] = input[y * w + x]
    return out
  }

  const horizontal = pass(luma, width, height)
  const vertical = pass(transpose(horizontal, width, height), height, width)
  return transpose(vertical, height, width)
}

/** Skin and the black shirt are each nearly flat; local contrast is what
    carries the likeness, so a high-pass boost runs before downsampling. */
function sharpen(luma, width, height, radius, gain) {
  const blurred = boxBlur(luma, width, height, radius)
  return luma.map((value, i) => value + gain * (value - blurred[i]))
}

function downsample(luma, width, height, columns, rows) {
  const out = new Float64Array(columns * rows)
  for (let row = 0; row < rows; row += 1) {
    const y0 = Math.floor((row * height) / rows)
    const y1 = Math.max(y0 + 1, Math.floor(((row + 1) * height) / rows))
    for (let column = 0; column < columns; column += 1) {
      const x0 = Math.floor((column * width) / columns)
      const x1 = Math.max(x0 + 1, Math.floor(((column + 1) * width) / columns))
      let sum = 0
      for (let y = y0; y < y1; y += 1)
        for (let x = x0; x < x1; x += 1) sum += luma[y * width + x]
      out[row * columns + column] = sum / ((y1 - y0) * (x1 - x0))
    }
  }
  return out
}

const work = mkdtempSync(join(tmpdir(), 'portrait-ascii-'))

try {
  const bmpPath = join(work, 'portrait.bmp')
  const supersample = 6

  execFileSync('sips', [
    '-s',
    'format',
    'bmp',
    '-z',
    String(rows * supersample),
    String(columns * supersample),
    source,
    '--out',
    bmpPath,
  ])

  const { width, height, luma } = decode(bmpPath)
  const detailed = sharpen(luma, width, height, supersample * 5, 0.8)
  const levels = normalise(downsample(detailed, width, height, columns, rows))

  const lines = []
  for (let y = 0; y < rows; y += 1) {
    let line = ''
    for (let x = 0; x < columns; x += 1) {
      // Gamma lifts the mid-tones of the face out of the flat dark mass; the
      // floor drops the wall — and the halo the high-pass leaves around the
      // head — to blank rather than a haze of stray dots.
      const ink = Math.pow(1 - levels[y * columns + x], 1.5)
      line +=
        ink < 0.14
          ? ' '
          : ramp[Math.min(ramp.length - 1, Math.round(ink * (ramp.length - 1)))]
    }
    lines.push(line.replace(/\s+$/, ''))
  }

  // Single quotes and no escaping needed: every ramp character is safe inside
  // a JS string literal, and this is the shape Prettier would emit anyway.
  const body = lines.map((line) => `  '${line}',`).join('\n')

  writeFileSync(
    target,
    `// Generated by scripts/generate-portrait-ascii.mjs from ${source}.\n` +
      `// Edit the script, not this file.\n\n` +
      `export const portraitAsciiColumns = ${columns}\n\n` +
      `export const portraitAscii = [\n${body}\n].join('\\n')\n`,
  )

  console.log(`${target}: ${columns}x${rows}`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
