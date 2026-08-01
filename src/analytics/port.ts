import type { ActionId, LinkId } from '#/content/hub-config'

export type AnalyticsEvent =
  | { type: 'visit' }
  | { type: 'link_click'; linkId: Exclude<LinkId, 'photos'> }
  | { type: 'action_click'; actionId: ActionId }

export type AnalyticsPort = {
  track: (event: AnalyticsEvent) => void
}

export function createNoopAnalytics(): AnalyticsPort {
  return {
    track() {},
  }
}

export function createFakeAnalytics() {
  const events: AnalyticsEvent[] = []
  const port: AnalyticsPort & { events: AnalyticsEvent[] } = {
    events,
    track(event) {
      events.push(event)
    },
  }
  return port
}
