import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createFakeAnalytics } from '#/analytics/port'
import { loadLocale } from '#/content/locale'
import { LinkHubPage } from '#/link-hub/LinkHubPage'

describe('Link Hub page', () => {
  it('shows the Owner Identity from Locale en', () => {
    const locale = loadLocale('en')
    const analytics = createFakeAnalytics()

    render(
      <LinkHubPage locale={locale} analytics={analytics} portraitSrc="/portrait.jpg" />,
    )

    expect(screen.getByText(locale.identity.role)).toBeTruthy()
    expect(screen.getByText(locale.identity.displayName)).toBeTruthy()
    expect(screen.getByText(locale.identity.bio)).toBeTruthy()
    expect(screen.getByText(locale.identity.availability)).toBeTruthy()
    expect(locale.identity.availability).toBe('Available for Hire')

    const portrait = screen.getByRole('img', { name: locale.identity.portraitAlt })
    expect(portrait.getAttribute('src')).toBe('/portrait.jpg')
    expect(portrait.getAttribute('src')).not.toMatch(/^https?:\/\//)

    expect(screen.queryByText(/EST\./i)).toBeNull()
    expect(screen.queryByRole('button', { name: /share/i })).toBeNull()
  })
})
