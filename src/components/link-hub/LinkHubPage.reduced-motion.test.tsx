import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { createFakeAnalytics } from '#/analytics/port'
import { loadLocale } from '#/content/locale'
import { LinkHubPage } from '#/components/link-hub/LinkHubPage'

/* Motion reads prefers-reduced-motion once per environment, so this seam lives in
   its own file where the query answers "reduce" before anything renders. */
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

afterEach(() => {
  cleanup()
})

function renderPage() {
  const locale = loadLocale('en')
  const analytics = createFakeAnalytics()
  render(
    <LinkHubPage
      locale={locale}
      analytics={analytics}
      hubUrl="https://devvrat.uk"
    />,
  )
  return { locale, analytics }
}

function linkName(copy: { label: string; title: string; handle?: string }) {
  return copy.handle
    ? `${copy.label}: ${copy.title} (${copy.handle})`
    : `${copy.label}: ${copy.title}`
}

describe('Link Hub page with reduced motion', () => {
  it('still shows Identity and every Link', () => {
    const { locale } = renderPage()

    expect(screen.getByText(locale.identity.displayName)).toBeTruthy()
    expect(screen.getByText(locale.identity.availability)).toBeTruthy()

    for (const copy of Object.values(locale.links)) {
      expect(screen.getByText(copy.title)).toBeTruthy()
    }
  })

  it('keeps Links and Copy URL operable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { locale, analytics } = renderPage()
    const action = locale.actions['copy-url']

    fireEvent.click(
      screen.getByRole('link', {
        name: linkName(locale.links.photos),
      }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: `${action.label}: ${action.title}` }),
    )

    expect(await screen.findByText(action.success)).toBeTruthy()
    expect(analytics.events).toContainEqual({
      type: 'link_click',
      linkId: 'photos',
    })
    expect(analytics.events).toContainEqual({
      type: 'action_click',
      actionId: 'copy-url',
    })
  })
})
