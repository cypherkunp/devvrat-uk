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

export const startInstance = createStart(() => ({
  requestMiddleware: [redirectWww],
}))
