import { createMiddleware, createStart } from '@tanstack/react-start'

import { apexLocation } from '#/content/hub-config'

const redirectWww = createMiddleware().server(({ next, request }) => {
  const location = apexLocation(request.url)
  if (location) {
    return new Response(null, {
      status: 308,
      headers: { Location: location },
    })
  }
  return next()
})

const cacheDocument = createMiddleware().server(async ({ next }) => {
  const result = await next()
  const { response } = result
  const type = response.headers.get('content-type') ?? ''
  if (response.status !== 200 || !type.includes('text/html')) return result

  response.headers.set(
    'Cache-Control',
    'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
  )
  return result
})

export const startInstance = createStart(() => ({
  requestMiddleware: [redirectWww, cacheDocument],
}))
