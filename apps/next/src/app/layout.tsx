import '@repo/ui/globals.css'
import { Toaster } from '@repo/ui/sonner'
import { Fraunces, Inter_Tight, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import AppProviders from '~/provider/AppProviders'

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-app',
  display: 'swap',
})

// The other three customize-panel fonts (D-06) load as CSS variables regardless of whether
// they're active, so switching fonts never triggers a network request mid-preview. Only Inter
// Tight is preloaded; next/font self-hosts these at build time, so no runtime third-party
// request is added (T-02-04).
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  preload: false,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false,
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: false,
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      className={`dark ${interTight.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  )
}
