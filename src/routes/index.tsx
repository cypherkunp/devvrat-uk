import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { createAnalyticsFromEnv } from '#/analytics/create'
import { hubOrigin } from '#/content/hub-config'
import { loadLocale } from '#/content/locale'
import { LinkHubPage } from '#/link-hub/LinkHubPage'

export const Route = createFileRoute('/')({ component: LinkHubRoute })

function LinkHubRoute() {
  const locale = loadLocale('en')
  const analytics = useMemo(() => createAnalyticsFromEnv(), [])

  const hubUrl = hubOrigin

  return <LinkHubPage locale={locale} analytics={analytics} hubUrl={hubUrl} />
}
