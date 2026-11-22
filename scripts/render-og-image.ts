/**
 * Renders `scripts/og-image.html` into `public/og-image.jpg`, the Link Hub's
 * 1200x630 share image. Run by hand (`pnpm og-image`) when the template or
 * the portrait changes; the JPEG is committed, so builds never need a browser.
 */
import { chromium } from '@playwright/test'

const templateUrl = new URL('./og-image.html', import.meta.url)
const outputPath = new URL('../public/og-image.jpg', import.meta.url)

const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  await page.goto(templateUrl.href)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: outputPath.pathname,
    type: 'jpeg',
    quality: 92,
  })
} finally {
  await browser.close()
}
