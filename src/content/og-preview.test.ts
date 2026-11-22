import { describe, expect, it } from 'vitest'

import { mergeOgPreview } from '#/content/og-preview'

describe('OG preview merge rule', () => {
  const og = {
    title: 'Devvrat · Projects',
    description: 'Projects and history.',
    image: 'https://avatars.githubusercontent.com/u/1',
  }

  it('lets Locale copy override OG fields', () => {
    expect(
      mergeOgPreview(
        {
          label: 'Projects',
          title: 'My projects',
          description: 'Hand-written.',
          handle: 'cypherkunp.github.io',
        },
        og,
      ),
    ).toEqual({
      label: 'Projects',
      title: 'My projects',
      description: 'Hand-written.',
      handle: 'cypherkunp.github.io',
      image: og.image,
    })
  })

  it('fills fields the Locale leaves out from OG', () => {
    expect(
      mergeOgPreview({ label: 'Projects', handle: 'cypherkunp.github.io' }, og),
    ).toEqual({
      label: 'Projects',
      title: og.title,
      description: og.description,
      handle: 'cypherkunp.github.io',
      image: og.image,
    })
  })

  it('falls back to the Locale label as title when neither has one', () => {
    expect(mergeOgPreview({ label: 'Projects', handle: 'x' })).toEqual({
      label: 'Projects',
      title: 'Projects',
      handle: 'x',
    })
    expect(
      mergeOgPreview({
        label: 'GitHub',
        title: 'GitHub',
        handle: 'cypherkunp',
      }),
    ).toEqual({ label: 'GitHub', title: 'GitHub', handle: 'cypherkunp' })
  })
})
