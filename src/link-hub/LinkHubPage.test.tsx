import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createFakeAnalytics } from '#/analytics/port'
import { loadLocale } from '#/content/locale'
import { LinkHubPage } from '#/link-hub/LinkHubPage'

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

describe('Link Hub page', () => {
  it('shows the Owner Identity from Locale en', () => {
    const { locale } = renderPage()

    expect(screen.getByText(locale.identity.role)).toBeTruthy()
    expect(screen.getByText(locale.identity.displayName)).toBeTruthy()
    expect(screen.getByText(locale.identity.bio)).toBeTruthy()
    expect(screen.getByText(locale.identity.availability)).toBeTruthy()
    expect(locale.identity.availability).toBe('Available for Hire')

    // The portrait is ASCII art, so it carries its meaning through the label
    // rather than through an image request.
    const portrait = screen.getByRole('img', {
      name: locale.identity.portraitAlt,
    })
    expect(portrait.querySelector('img')).toBeNull()
    expect(portrait.querySelector('pre')?.getAttribute('aria-hidden')).toBe(
      'true',
    )

    expect(screen.queryByText(/EST\./i)).toBeNull()
    expect(screen.queryByRole('button', { name: /^share$/i })).toBeNull()
  })

  it('routes configured Links to their destinations and highlights Central Hub', () => {
    const { locale } = renderPage()

    const email = screen.getByRole('link', {
      name: `${locale.links.email.label}: ${locale.links.email.title}`,
    })
    expect(email.getAttribute('href')).toBe('mailto:devvrat.shukla@gmail.com')
    expect(screen.getByText(locale.links.email.title)).toBeTruthy()
    expect(screen.getByText(locale.links.email.handle!)).toBeTruthy()

    const twitter = screen.getByRole('link', {
      name: `${locale.links.twitter.label}: ${locale.links.twitter.title}`,
    })
    expect(twitter.getAttribute('href')).toBe('https://x.com/devvrathq')

    const linkedin = screen.getByRole('link', {
      name: `${locale.links.linkedin.label}: ${locale.links.linkedin.title}`,
    })
    expect(linkedin.getAttribute('href')).toBe(
      'https://www.linkedin.com/in/devvratshukla',
    )

    const github = screen.getByRole('link', {
      name: `${locale.links.github.label}: ${locale.links.github.title}`,
    })
    expect(github.getAttribute('href')).toBe('https://github.com/cypherkunp')

    const central = screen.getByRole('link', {
      name: `${locale.links['central-hub'].label}: ${locale.links['central-hub'].title}`,
    })
    expect(central.getAttribute('href')).toBe('https://devvrat.cc')
    expect(central.getAttribute('data-highlighted')).toBe('true')
  })

  it('shows Photos coming soon in-page and does not navigate away', async () => {
    const { locale } = renderPage()
    const photos = locale.links.photos
    const control = screen.getByRole('button', {
      name: `${photos.label}: ${photos.title}`,
    })

    expect(control.closest('a')).toBeNull()
    expect(screen.queryByText(photos.comingSoon)).toBeNull()

    fireEvent.click(control)

    expect(screen.getByText(photos.comingSoon)).toBeTruthy()
    expect(window.location.href).not.toMatch(/photos/i)
  })

  it('copies the Link Hub URL and shows success feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { locale } = renderPage()
    const action = locale.actions['copy-url']
    const control = screen.getByRole('button', {
      name: `${action.label}: ${action.title}`,
    })

    fireEvent.click(control)

    expect(writeText).toHaveBeenCalledWith('https://devvrat.uk')
    expect(await screen.findByText(action.success)).toBeTruthy()
  })

  it('exposes labelled keyboard-operable Links and Action', () => {
    const { locale } = renderPage()

    const namedControls = [
      ...screen.getAllByRole('link'),
      ...screen.getAllByRole('button'),
    ]

    expect(namedControls.length).toBeGreaterThanOrEqual(7)

    for (const control of namedControls) {
      expect(control.getAttribute('aria-label')).toBeTruthy()
      expect(control.getAttribute('tabindex')).not.toBe('-1')
      expect(control.getAttribute('aria-disabled')).not.toBe('true')
    }

    expect(
      screen.getByRole('button', {
        name: `${locale.actions['copy-url'].label}: ${locale.actions['copy-url'].title}`,
      }),
    ).toBeTruthy()
  })

  it('records one Visit when the Link Hub opens', () => {
    const { analytics } = renderPage()

    expect(analytics.events).toEqual([{ type: 'visit' }])
    expect(screen.queryByText(/consent|cookie/i)).toBeNull()
  })

  it('records link_click with the Link id when a configured Link is activated', () => {
    const { locale, analytics } = renderPage()
    const email = locale.links.email

    fireEvent.click(
      screen.getByRole('link', { name: `${email.label}: ${email.title}` }),
    )

    expect(analytics.events).toContainEqual({
      type: 'link_click',
      linkId: 'email',
    })
  })

  it('records action_click when Copy URL succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { locale, analytics } = renderPage()
    const action = locale.actions['copy-url']

    fireEvent.click(
      screen.getByRole('button', {
        name: `${action.label}: ${action.title}`,
      }),
    )

    expect(await screen.findByText(action.success)).toBeTruthy()
    expect(analytics.events).toContainEqual({
      type: 'action_click',
      actionId: 'copy-url',
    })
  })

  it('does not record link_click for Photos placeholder', () => {
    const { locale, analytics } = renderPage()
    const photos = locale.links.photos

    fireEvent.click(
      screen.getByRole('button', {
        name: `${photos.label}: ${photos.title}`,
      }),
    )

    expect(analytics.events.some((event) => event.type === 'link_click')).toBe(
      false,
    )
  })
})
