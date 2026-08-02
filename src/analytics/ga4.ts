import type { AnalyticsEvent, AnalyticsPort } from '#/analytics/port'

export type GtagFn = (...args: unknown[]) => void

export type CreateGa4AnalyticsOptions = {
  measurementId: string
  gtag?: GtagFn
  loadScript?: (measurementId: string) => void
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: GtagFn
  }
}

function defaultLoadScript(measurementId: string) {
  if (typeof document === 'undefined') return

  const src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  if (document.querySelector(`script[src="${src}"]`)) return

  const script = document.createElement('script')
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

function defaultGtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(args)
}

function ensureGtag(
  measurementId: string,
  loadScript: (measurementId: string) => void,
): GtagFn {
  if (typeof window === 'undefined') {
    return () => {}
  }

  loadScript(measurementId)

  if (!window.gtag) {
    window.dataLayer = window.dataLayer ?? []
    window.gtag = defaultGtag
    window.gtag('js', new Date())
    window.gtag('config', measurementId)
  }

  return window.gtag
}

function toGtagArgs(event: AnalyticsEvent): unknown[] {
  switch (event.type) {
    case 'visit':
      return ['event', 'visit']
    case 'link_click':
      return ['event', 'link_click', { link_id: event.linkId }]
    case 'action_click':
      return ['event', 'action_click', { action_id: event.actionId }]
  }
}

export function createGa4Analytics({
  measurementId,
  gtag: injectedGtag,
  loadScript = defaultLoadScript,
}: CreateGa4AnalyticsOptions): AnalyticsPort {
  // Lazy: gtag.js only loads on first track (visit runs post-hydration).
  let gtag: GtagFn | undefined

  function resolveGtag(): GtagFn {
    if (gtag) return gtag

    if (injectedGtag) {
      loadScript(measurementId)
      injectedGtag('config', measurementId)
      gtag = injectedGtag
    } else {
      gtag = ensureGtag(measurementId, loadScript)
    }

    return gtag
  }

  return {
    track(event) {
      resolveGtag()(...toGtagArgs(event))
    },
  }
}
