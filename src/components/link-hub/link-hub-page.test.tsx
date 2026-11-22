import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createFakeAnalytics } from '#/analytics/port'
import { loadLocale } from '#/content/locale'
import type { LinkCopy } from '#/content/locale'
import type { OgPreviews } from '#/content/og-preview'
import { LinkHubPage } from '#/components/link-hub/link-hub-page'

afterEach(() => {
  cleanup()
})

function renderPage(ogPreviews: OgPreviews = {}) {
  const locale = loadLocale('en')
  const analytics = createFakeAnalytics()
  render(
    <LinkHubPage
      locale={locale}
      analytics={analytics}
      hubUrl="https://devvrat.uk"
      ogPreviews={ogPreviews}
    />,
  )
  return { locale, analytics }
}

function linkName(copy: LinkCopy) {
  const name =
    !copy.title || copy.title === copy.label
      ? copy.label
      : `${copy.label}: ${copy.title}`
  return copy.handle ? `${name} (${copy.handle})` : name
}

describe('Link Hub page', () => {
  it('paints the hub stage visible on first render', () => {
    renderPage()

    const stage = document.querySelector<HTMLElement>('.hub-stage')
    expect(stage).toBeTruthy()
    expect(stage?.style.opacity).not.toBe('0')
    expect(stage?.getAttribute('style') ?? '').not.toMatch(/opacity:\s*0/)
  })

  it('shows the Owner Identity from Locale en', () => {
    const { locale } = renderPage()

    expect(screen.getByText(locale.identity.role)).toBeTruthy()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: locale.identity.displayName,
      }),
    ).toBeTruthy()
    expect(screen.getByText(locale.identity.bio)).toBeTruthy()
    expect(screen.queryByText(locale.identity.bioLabel)).toBeNull()
    expect(screen.getByText(locale.identity.availability)).toBeTruthy()
    expect(locale.identity.availability).toBe('Available for Hire')

    const portrait = screen.getByRole('img', {
      name: locale.identity.portraitAlt,
    })
    const name = screen.getByRole('heading', {
      level: 1,
      name: locale.identity.displayName,
    })
    expect(portrait.getAttribute('src')).toBe('/portrait.jpg')
    expect(portrait.closest('.geist-avatar')).toBeTruthy()
    expect(name.closest('.tile')?.contains(portrait)).toBe(true)

    expect(screen.queryByText(/EST\./i)).toBeNull()
    expect(screen.queryByRole('button', { name: /^share$/i })).toBeNull()

    const resume = screen.getByRole('link', {
      name: linkName({
        ...locale.links.resume,
        title: locale.identity.availability,
      }),
    })
    expect(resume.getAttribute('href')).toBe('https://www.devvrat.cc/about')
    expect(screen.getByText(locale.links.resume.handle!)).toBeTruthy()
  })

  it('credits the Owner in a footer landmark outside the main content', () => {
    const { locale } = renderPage()
    const footer = screen.getByRole('contentinfo')

    expect(footer.textContent).toContain(
      `${locale.footer.credit}. ${locale.footer.rights}`,
    )
    expect(footer.querySelectorAll('p')).toHaveLength(1)
    expect(footer.closest('main')).toBeNull()
  })

  it('routes configured Links with Portfolio, hire, Handbook, then Projects first', () => {
    const { locale } = renderPage()

    expect(document.querySelector('a[href^="mailto:"]')).toBeNull()
    expect(screen.queryByText('Email')).toBeNull()
    expect(screen.queryByText('Central Hub')).toBeNull()
    expect(locale.links['central-hub'].label).toBe('Portfolio')

    const resume = screen.getByRole('link', {
      name: linkName({
        ...locale.links.resume,
        title: locale.identity.availability,
      }),
    })
    const portfolio = screen.getByRole('link', {
      name: linkName(locale.links['central-hub']),
    })
    const linkedin = screen.getByRole('link', {
      name: linkName(locale.links.linkedin),
    })
    const github = screen.getByRole('link', {
      name: linkName(locale.links.github),
    })
    const twitter = screen.getByRole('link', {
      name: linkName(locale.links.twitter),
    })
    const handbook = screen.getByRole('link', {
      name: linkName(locale.links.handbook),
    })
    const photos = screen.getByRole('link', {
      name: linkName(locale.links.photos),
    })
    const projects = screen.getByRole('link', {
      name: 'Projects (cypherkunp.github.io)',
    })

    expect(resume.getAttribute('href')).toBe('https://www.devvrat.cc/about')
    expect(portfolio.getAttribute('href')).toBe('https://devvrat.cc')
    expect(portfolio.getAttribute('data-highlighted')).toBe('true')
    expect(linkedin.getAttribute('href')).toBe(
      'https://www.linkedin.com/in/devvratshukla',
    )
    expect(github.getAttribute('href')).toBe('https://github.com/cypherkunp')
    expect(twitter.getAttribute('href')).toBe('https://x.com/devvrathq')
    expect(handbook.getAttribute('href')).toBe(
      'https://www.devvrat.cc/posts/handbook',
    )
    expect(photos.getAttribute('href')).toBe('https://www.devvrat.cc/photos')
    expect(projects.getAttribute('href')).toBe('https://cypherkunp.github.io/')

    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href')),
    ).toEqual([
      portfolio.getAttribute('href'),
      resume.getAttribute('href'),
      handbook.getAttribute('href'),
      projects.getAttribute('href'),
      linkedin.getAttribute('href'),
      github.getAttribute('href'),
      twitter.getAttribute('href'),
      photos.getAttribute('href'),
    ])
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

  it('says when the clipboard refuses and shows the URL to copy by hand', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const { locale, analytics } = renderPage()
    const action = locale.actions['copy-url']

    fireEvent.click(
      screen.getByRole('button', { name: `${action.label}: ${action.title}` }),
    )

    expect(
      await screen.findByText(action.failure.replace('{url}', 'devvrat.uk')),
    ).toBeTruthy()
    expect(screen.queryByText(action.success)).toBeNull()
    expect(analytics.events).not.toContainEqual({
      type: 'action_click',
      actionId: 'copy-url',
    })
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
    const github = locale.links.github

    fireEvent.click(screen.getByRole('link', { name: linkName(github) }))

    expect(analytics.events).toContainEqual({
      type: 'link_click',
      linkId: 'github',
    })
  })

  it('records link_click for the Projects Link', () => {
    const { analytics } = renderPage()

    fireEvent.click(
      screen.getByRole('link', { name: 'Projects (cypherkunp.github.io)' }),
    )

    expect(analytics.events).toContainEqual({
      type: 'link_click',
      linkId: 'projects',
    })
  })

  it('shows the OG preview on the opted-in Projects tile', () => {
    const image = 'https://avatars.githubusercontent.com/u/1?v=4'
    renderPage({
      projects: {
        title: 'Devvrat · Projects',
        description: "Devvrat's projects and GitHub contribution history.",
        image,
      },
    })

    const projects = screen.getByRole('link', {
      name: 'Projects: Devvrat · Projects (cypherkunp.github.io)',
    })
    expect(projects.getAttribute('href')).toBe('https://cypherkunp.github.io/')
    expect(projects.textContent).toContain('Devvrat · Projects')
    expect(projects.textContent).toContain(
      "Devvrat's projects and GitHub contribution history.",
    )
    expect(projects.textContent).toContain('cypherkunp.github.io')

    const preview = projects.querySelector('img')
    expect(preview?.getAttribute('src')).toBe(image)
    expect(preview?.getAttribute('alt')).toBe('')
    expect(preview?.getAttribute('loading')).toBe('lazy')
    expect(preview?.getAttribute('width')).toBeTruthy()
    expect(preview?.getAttribute('height')).toBeTruthy()
  })

  it('falls back to Locale copy when the Projects tile has no OG preview', () => {
    renderPage()

    const projects = screen.getByRole('link', {
      name: 'Projects (cypherkunp.github.io)',
    })
    expect(projects.querySelector('img')).toBeNull()
    expect(projects.textContent).toBe('Projectscypherkunp.github.io')
  })

  it('records link_click for the resume Link on the hire tile', () => {
    const { locale, analytics } = renderPage()

    fireEvent.click(
      screen.getByRole('link', {
        name: linkName({
          ...locale.links.resume,
          title: locale.identity.availability,
        }),
      }),
    )

    expect(analytics.events).toContainEqual({
      type: 'link_click',
      linkId: 'resume',
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

  it('toggles monochrome mode from the Display switch tile', () => {
    const { locale, analytics } = renderPage()
    const action = locale.actions.mono
    const control = screen.getByRole('switch', {
      name: `${action.label}: ${action.title}`,
    })

    expect(control.getAttribute('aria-checked')).toBe('false')
    expect(document.querySelector('[data-mono="true"]')).toBeNull()

    fireEvent.click(control)

    expect(control.getAttribute('aria-checked')).toBe('true')
    expect(document.querySelector('[data-mono="true"]')).toBeTruthy()
    expect(analytics.events).toContainEqual({
      type: 'action_click',
      actionId: 'mono',
    })

    fireEvent.click(control)

    expect(control.getAttribute('aria-checked')).toBe('false')
    expect(document.querySelector('[data-mono="true"]')).toBeNull()
  })

  it('toggles Dark from the Appearance switch tile', () => {
    const { locale, analytics } = renderPage()
    const action = locale.actions.dark
    const control = screen.getByRole('switch', {
      name: `${action.label}: ${action.title}`,
    })

    expect(control.getAttribute('aria-checked')).toBe('false')
    expect(document.querySelector('[data-scheme]')).toBeNull()

    fireEvent.click(control)

    expect(control.getAttribute('aria-checked')).toBe('true')
    expect(document.querySelector('[data-scheme="dark"]')).toBeTruthy()
    expect(analytics.events).toContainEqual({
      type: 'action_click',
      actionId: 'dark',
    })

    fireEvent.click(control)

    expect(control.getAttribute('aria-checked')).toBe('false')
    expect(document.querySelector('[data-scheme="light"]')).toBeTruthy()
  })

  it('follows OS dark without a session scheme until the switch is used', () => {
    const previous = window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-color-scheme: dark'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })

    try {
      const { locale } = renderPage()
      const action = locale.actions.dark
      const control = screen.getByRole('switch', {
        name: `${action.label}: ${action.title}`,
      })

      expect(control.getAttribute('aria-checked')).toBe('true')
      expect(document.querySelector('[data-scheme]')).toBeNull()
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: previous,
      })
    }
  })

  it('keeps Dark and Mono independent', () => {
    const { locale } = renderPage()
    const dark = locale.actions.dark
    const mono = locale.actions.mono

    fireEvent.click(
      screen.getByRole('switch', {
        name: `${dark.label}: ${dark.title}`,
      }),
    )
    fireEvent.click(
      screen.getByRole('switch', {
        name: `${mono.label}: ${mono.title}`,
      }),
    )

    const stage = document.querySelector('.hub-stage')
    expect(stage?.getAttribute('data-scheme')).toBe('dark')
    expect(stage?.getAttribute('data-mono')).toBe('true')
  })

  it('records link_click with the Link id when Photos is activated', () => {
    const { locale, analytics } = renderPage()
    const photos = locale.links.photos

    fireEvent.click(screen.getByRole('link', { name: linkName(photos) }))

    expect(analytics.events).toContainEqual({
      type: 'link_click',
      linkId: 'photos',
    })
  })
})
