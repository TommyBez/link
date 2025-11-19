import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/submissions(.*)',
  '/intake(.*)',
])

const isOnboardingRoute = createRouteMatcher(['/studio/new(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req) || isOnboardingRoute(req)) {
    return
  }

  const { userId, orgId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  if (!orgId) {
    const url = new URL('/studio/new', req.url)
    return Response.redirect(url)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|\\.well-known/workflow|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
