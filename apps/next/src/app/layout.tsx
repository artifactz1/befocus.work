import '@repo/ui/globals.css'
import ThemeProvider from '~/components/sessions/ThemeProvider'
import AppProviders from '~/provider/AppProviders'

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,200..900;1,200..900&display=swap'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className='dark' suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='' />
        <link rel='stylesheet' href={FONTS_URL} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
