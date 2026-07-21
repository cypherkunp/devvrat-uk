export type AnalyticsEvent =
  | { type: 'visit' }
  | { type: 'link_click'; linkId: string }
  | { type: 'action_click'; actionId: string }

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
