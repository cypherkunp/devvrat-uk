import { expect, test } from '@playwright/test'

import { hubLinks, resumeHref } from '../src/content/hub-config'

const outboundHttpHrefs = [
  resumeHref,
  ...hubLinks.flatMap((link) =>
    link.href.startsWith('http') ? [link.href] : [],
  ),
]

test('Link Hub loads in the browser', async ({ page }) => {
  const response = await page.goto('/')

  expect(response, 'homepage should respond').toBeTruthy()
  expect(
    response!.ok(),
    `homepage returned ${response!.status()} ${response!.url()}`,
  ).toBe(true)

  await expect(
    page.getByRole('heading', { level: 1, name: 'Devvrat' }),
  ).toBeVisible()
})

test('Link Hub lists every outbound http Link', async ({ page }) => {
  await page.goto('/')

  const hrefs = await page
    .locator('a[href^="http"]')
    .evaluateAll((anchors) =>
      [
        ...new Set(
          anchors
            .map((anchor) => anchor.getAttribute('href'))
            .filter((href): href is string => Boolean(href)),
        ),
      ].sort(),
    )

  expect(hrefs).toEqual([...outboundHttpHrefs].sort())
})

for (const href of outboundHttpHrefs) {
  test(`opens ${href} without error`, async ({ page }) => {
    const response = await page.goto(href, {
      waitUntil: 'domcontentloaded',
      timeout: 25_000,
    })
    const status = response?.status() ?? 0
    const title = await page.title()
    let checked = status
    if (status === 403 || status === 429 || status === 999) {
      checked = (
        await fetch(href, {
          headers: {
            accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(25_000),
        })
      ).status
    }
    const issue = `${href}\n  status  ${checked || 'no response'}\n  title   ${title}`

    expect(checked, issue).toBeGreaterThanOrEqual(200)
    expect(checked, issue).toBeLessThan(400)
    expect(title, issue).not.toMatch(/not found|\b404\b/i)
  })
}

test('unknown path shows 404 then redirects to the Link Hub', async ({
  page,
}) => {
  await page.clock.install()
  const response = await page.goto('/no-such-place')

  expect(response, 'unknown path should respond').toBeTruthy()
  await expect(
    page.getByRole('heading', { level: 1, name: '404' }),
  ).toBeVisible()
  await expect(
    page.getByText('Looks like you have wandered off the map'),
  ).toBeVisible()
  await expect(
    page.getByText('Redirecting you to the homepage in 10'),
  ).toBeVisible()

  await page.clock.runFor(1000)
  await expect(
    page.getByText('Redirecting you to the homepage in 9'),
  ).toBeVisible()

  await page.clock.runFor(9000)
  await expect(page).toHaveURL('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Devvrat' }),
  ).toBeVisible()
})
