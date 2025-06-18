import '@repo/ui/globals.css'
import ThemeProvider from '~/components/sessions/ThemeProvider'
import AppProviders from '~/provider/AppProviders'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className='dark' suppressHydrationWarning>
        <body suppressHydrationWarning>
          <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
            <AppProviders>{children}</AppProviders>
          </ThemeProvider>
        </body>
    </html>
  )
}
