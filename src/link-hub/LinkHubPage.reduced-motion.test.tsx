import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { createFakeAnalytics } from '#/analytics/port'
import { loadLocale } from '#/content/locale'
import { LinkHubPage } from '#/link-hub/LinkHubPage'

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
      portraitSrc="/portrait.jpg"
      hubUrl="https://devvrat.uk"
    />,
  )
  return { locale, analytics }
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

  it('keeps Links, the Photos placeholder, and Copy URL operable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { locale, analytics } = renderPage()
    const photos = locale.links.photos
    const action = locale.actions['copy-url']

    fireEvent.click(
      screen.getByRole('link', {
        name: `${locale.links.email.label}: ${locale.links.email.title}`,
      }),
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: `${photos.label}: ${photos.title}`,
      }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: `${action.label}: ${action.title}` }),
    )

    expect(screen.getByText(photos.comingSoon)).toBeTruthy()
    expect(await screen.findByText(action.success)).toBeTruthy()
    expect(analytics.events).toContainEqual({
      type: 'link_click',
      linkId: 'email',
    })
    expect(analytics.events).toContainEqual({
      type: 'action_click',
      actionId: 'copy-url',
    })
  })
})
