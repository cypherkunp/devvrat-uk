import { describe, expect, it, vi } from 'vitest'

import { createGa4Analytics } from '#/analytics/ga4'

describe('GA4 analytics adapter', () => {
  it('maps Visit, link_click, and action_click through gtag', () => {
    const gtag = vi.fn()
    const analytics = createGa4Analytics({
      measurementId: 'G-TEST123',
      gtag,
    })

    analytics.track({ type: 'visit' })
    analytics.track({ type: 'link_click', linkId: 'email' })
    analytics.track({ type: 'action_click', actionId: 'copy-url' })

    expect(gtag).toHaveBeenCalledWith('event', 'visit')
    expect(gtag).toHaveBeenCalledWith('event', 'link_click', {
      link_id: 'email',
    })
    expect(gtag).toHaveBeenCalledWith('event', 'action_click', {
      action_id: 'copy-url',
    })
  })

  it('defers GA4 script load and config until the first track', () => {
    const gtag = vi.fn()
    const loadScript = vi.fn()

    const analytics = createGa4Analytics({
      measurementId: 'G-ENV456',
      gtag,
      loadScript,
    })

    expect(loadScript).not.toHaveBeenCalled()
    expect(gtag).not.toHaveBeenCalled()

    analytics.track({ type: 'visit' })

    expect(loadScript).toHaveBeenCalledWith('G-ENV456')
    expect(gtag).toHaveBeenCalledWith('config', 'G-ENV456')
    expect(gtag).toHaveBeenCalledWith('event', 'visit')
  })
})
