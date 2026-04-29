import '@repo/ui/globals.css'
import { Inter_Tight } from 'next/font/google'
import ThemeProvider from '~/components/sessions/ThemeProvider'
import AppProviders from '~/provider/AppProviders'

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-app',
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className={`dark ${interTight.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
