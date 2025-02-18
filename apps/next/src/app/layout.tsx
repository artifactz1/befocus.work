import '@repo/ui/globals.css'
import AppProviders from '~/provider/AppProviders'

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "░ ►▬ Be Focused ▬◄ ░",
  description: "artifactz - Art Punsalang ",
  icons: [{ rel: "icon", url: "/avatar-cropped.webp" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
