import { createGa4Analytics } from '#/analytics/ga4'
import { createNoopAnalytics } from '#/analytics/port'
import type { AnalyticsPort } from '#/analytics/port'

export function createAnalyticsFromEnv(
  measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID,
): AnalyticsPort {
  if (!measurementId) {
    return createNoopAnalytics()
  }

  return createGa4Analytics({ measurementId })
}
