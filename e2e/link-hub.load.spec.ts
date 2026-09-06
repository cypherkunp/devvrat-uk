import { expect, test } from '@playwright/test'

import { hubLinks, resumeHref } from '../src/content/hub-config'
import type { ConfiguredLink, HubLink } from '../src/content/hub-config'

function isConfigured(link: HubLink): link is ConfiguredLink {
  return 'href' in link
}

const outboundHttpHrefs = [
  ...hubLinks.filter(isConfigured).map((link) => link.href),
  resumeHref,
].filter((href) => href.startsWith('http'))

const chromeUA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function isErrorTitle(title: string) {
  return /not found|\b404\b/i.test(title)
}

function isBotChallenge(status: number) {
  return status === 403 || status === 429 || status === 999
}

async function fetchAsBrowser(href: string) {
  const response = await fetch(href, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': chromeUA,
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(25_000),
  })
  return response.status
}

type LinkFailure = {
  href: string
  status: number
  title: string
  error?: string
}

function formatLinkFailures(failures: LinkFailure[]) {
  const heading =
    failures.length === 1
      ? '1 outbound Link failed when opened:'
      : `${failures.length} outbound Links failed when opened:`

  const details = failures.map((failure, index) => {
    const status = failure.status || 'no response'
    const lines = [`${index + 1}. ${failure.href}`, `   status  ${status}`]
    if (failure.title) lines.push(`   title   ${failure.title}`)
    if (failure.error) lines.push(`   error   ${failure.error}`)
    return lines.join('\n')
  })

  return [heading, '', ...details].join('\n')
}

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

test('outbound http Links do not error when opened', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000)

  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Devvrat' }),
  ).toBeVisible()

  const pageHrefs = await page
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

  expect(pageHrefs).toEqual([...outboundHttpHrefs].sort())

  const failures: LinkFailure[] = []

  for (const href of pageHrefs) {
    const tab = await context.newPage()
    try {
      const response = await tab.goto(href, {
        waitUntil: 'domcontentloaded',
        timeout: 25_000,
      })
      const status = response?.status() ?? 0
      const title = await tab.title()
      if (response?.ok() && !isErrorTitle(title)) continue
      if (isBotChallenge(status)) {
        const retryStatus = await fetchAsBrowser(href)
        if (retryStatus >= 200 && retryStatus < 400) continue
        failures.push({
          href,
          status: retryStatus,
          title,
          error: `browser ${status}`,
        })
        continue
      }
      failures.push({ href, status, title })
    } catch (error) {
      failures.push({
        href,
        status: 0,
        title: '',
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      await tab.close()
    }
  }

  if (failures.length > 0) {
    throw new Error(formatLinkFailures(failures))
  }
})
