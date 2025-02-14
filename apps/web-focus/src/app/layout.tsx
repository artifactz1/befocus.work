import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";
import GlobalListener from './_components/GlobalListener';

export const metadata: Metadata = {
  title: "░ ►▬ Be Focused ▬◄ ░",
  description: "artifactz - Art Punsalang ",
  icons: [{ rel: "icon", url: "/avatar-cropped.webp" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <Toaster />
        <GlobalListener />
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
