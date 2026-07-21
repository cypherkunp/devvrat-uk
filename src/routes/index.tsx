import { createFileRoute } from '@tanstack/react-router'

import { createNoopAnalytics } from '#/analytics/port'
import { loadLocale } from '#/content/locale'
import { LinkHubPage } from '#/link-hub/LinkHubPage'

export const Route = createFileRoute('/')({ component: LinkHubRoute })

function LinkHubRoute() {
  const locale = loadLocale('en')
  const analytics = createNoopAnalytics()

  return (
    <LinkHubPage locale={locale} analytics={analytics} portraitSrc="/portrait.jpg" />
  )
}
