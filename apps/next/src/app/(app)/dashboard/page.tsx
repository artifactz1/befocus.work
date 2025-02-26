"use client"

import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'
import { signOut } from '~/lib/auth.client'

export default function Dashboard() {
  const router = useRouter();

  // TODO: update use of useSession with useQueryClient
  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/sign-in')
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }

  return (
    <div>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  )
}
