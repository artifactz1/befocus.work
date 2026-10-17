import { LookPaintScript } from '~/components/customize/LookPaintScript'
import GuestShell from './GuestShell'

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LookPaintScript tokens={null} />
      <GuestShell>{children}</GuestShell>
    </>
  )
}
