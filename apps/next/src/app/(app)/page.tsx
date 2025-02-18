// 'use client'

// import { Button } from '@repo/ui/components/ui/button'
// import { useQuery } from '@tanstack/react-query'
// import { useRouter } from 'next/navigation'
// import { api } from '~/lib/api.client'
// import { signOut, useSession } from '~/lib/auth.client'

// export default function App() {
//   const router = useRouter()
//   const session = useSession()

//   const { data: test } = useQuery({
//     queryKey: ['hello'],
//     queryFn: async () => {
//       const response = await api.user.accounts.$get()
//       if (!response.ok) {
//         return null
//       }

//       return await response.json()
//     },
//   })

//   const user = session.data?.user

//   if (!user) {
//     return <p>Not logged in</p>
//   }

//   // TODO: update use of useSession with useQueryClient
//   const handleSignOut = async () => {
//     try {
//       await signOut()
//       router.push('/')
//     } catch (error) {
//       console.error('Sign out failed', error)
//     }
//   }

//   return (
//     <div>
//       <p>Logged in as: {user.email}</p>
//       <Button onClick={handleSignOut}>Sign Out</Button>
//       {test && <p>Providers: {test.map(provider => provider.providerId).join(', ')}</p>}
//     </div>
//   )
// }

"use client"

import { Button } from '@repo/ui/button';
import { useRouter } from 'next/navigation';
import Footer from '~/_components/Footer';
import Header from '~/_components/Header';
import Timer from '~/_components/timer/Timer';
import { signOut } from '~/lib/auth.client';

export default function page() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center">
      {/* <main className=" mx-auto flex h-screen w-screen flex-col items-center justify-center lg:mx-0 lg:max-w-full"> */}
      <Header />
      <Timer />
      <Footer />
      <Button onClick={handleSignOut}>Sign Out</Button>
    </main>
  )
}
