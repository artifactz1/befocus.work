import { betterFetch } from '@better-fetch/fetch'
import type { Session } from '@repo/api/db/schemas'
import { env } from '@repo/app/env/next'
import { type NextRequest, NextResponse } from 'next/server'

export default async function authMiddleware(request: NextRequest) {
  // Fetch the session data from the backend
  // Because of cross domain cookies, session is the same
  const { data: session } = await betterFetch<Session>(`${env.API_URL}/api/auth/get-session`, {
    baseURL: request.nextUrl.origin,
    headers: {
      // Get the cookie from the request
      cookie: request.headers.get('cookie') || '',
    },
  })

  // If no session is found, redirect to the sign-in page
  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // If session exists, continue to the next middleware or route
  return NextResponse.next()
}

export async function middleware(request: NextRequest) {
  return await authMiddleware(request)
}

export const config = {
  matcher: [
    '/',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    // "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
