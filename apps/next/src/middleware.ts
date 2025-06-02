import { betterFetch } from '@better-fetch/fetch'
import type { Session } from '@repo/api/db/schemas'
import { env } from '@repo/app/env/next'
import { type NextRequest, NextResponse } from 'next/server'

const authRoutes = ['/sign-in', '/sign-up']
const passwordRoutes = ['/reset-password-success', '/forgot-password']

export default async function authMiddleware(request: NextRequest) {
  const pathName = request.nextUrl.pathname
  const isAuthRoute = authRoutes.includes(pathName)
  const isPasswordRoute = passwordRoutes.includes(pathName)
  const isHomeRoute = pathName === '/guest'

  // Fetch the session data from the backend
  const { data: session } = await betterFetch<Session>(`${env.API_URL}/api/auth/get-session`, {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  })

  // If no session is found, allow auth and password routes
  if (!session) {
    if (isAuthRoute || isPasswordRoute || isHomeRoute) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/guest', request.url))
  }

  // If session exists and user is on the home page, redirect to dashboard
  if (session && isHomeRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If session exists and not on home, continue
  return NextResponse.next()
}

export async function middleware(request: NextRequest) {
  return await authMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sounds|guest).*)',
  ],
}
