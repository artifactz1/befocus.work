// 'use client'

// import { Button } from '@repo/ui/button'
// import Image from 'next/image'
// import { signIn } from '~/lib/auth.client'

// export default function SignIn() {
//   const homePageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/`

//   return (
//     <div className='flex flex-col items-center justify-center h-full gap-10'>
//       <h1 className='text-4xl font-bold'>Be Focus</h1>
//       <div>
//         <div className='flex flex-col gap-12 flex-1 items-center justify-center h-full max-w-sm w-80'>
//           <Button
//             className='flex gap-2 w-full'
//             onClick={() => signIn.social({ provider: 'github', callbackURL: homePageUrl })}
//           >
//             <Image
//               alt='GitHub Logo'
//               src={'https://www.cdnlogo.com/logos/g/69/github-icon.svg'}
//               width={20}
//               height={20}
//             />
//             Github SignIn
//           </Button>
//           <Button
//             className='flex gap-2 w-full'
//             onClick={() =>
//               signIn.social({
//                 provider: 'google',
//                 callbackURL: homePageUrl,
//               })
//             }
//           >
//             <Image
//               alt='Google Logo'
//               src={'https://www.cdnlogo.com/logos/g/35/google-icon.svg'}
//               width={20}
//               height={20}
//             />
//             Google SignIn
//           </Button>
//           <Button
//             className='flex gap-2 w-full'
//             onClick={() =>
//               signIn.social({
//                 provider: 'discord',
//                 callbackURL: homePageUrl,
//               })
//             }
//           >
//             <Image
//               alt='Discord'
//               src={'https://static.cdnlogo.com/logos/d/15/discord.svg'}
//               width={20}
//               height={20}
//             />
//             Discord SignIn
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'
import { Button } from '@repo/ui/button'
import Image from 'next/image'
import { signIn } from '~/lib/auth.client'

export default function SignIn() {
  const homePageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/`

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md'>
        {/* Card Container */}
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-8'>
          {/* Header */}
          <div className='text-center mb-8'>
            <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
              Welcome to Be Focus
            </h1>
            <p className='text-sm text-gray-600'>
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Sign-in Buttons */}
          <div className='space-y-3'>
            <Button
              variant='outline'
              className='flex items-center justify-center gap-3 w-full h-11 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors'
              onClick={() => signIn.social({ provider: 'github', callbackURL: homePageUrl })}
            >
              <Image
                alt='GitHub'
                src='https://www.cdnlogo.com/logos/g/69/github-icon.svg'
                width={18}
                height={18}
              />
              <span className='font-medium text-gray-700'>Continue with GitHub</span>
            </Button>

            <Button
              variant='outline'
              className='flex items-center justify-center gap-3 w-full h-11 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors'
              onClick={() =>
                signIn.social({
                  provider: 'google',
                  callbackURL: homePageUrl,
                })
              }
            >
              <Image
                alt='Google'
                src='https://www.cdnlogo.com/logos/g/35/google-icon.svg'
                width={18}
                height={18}
              />
              <span className='font-medium text-gray-700'>Continue with Google</span>
            </Button>

            <Button
              variant='outline'
              className='flex items-center justify-center gap-3 w-full h-11 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors'
              onClick={() =>
                signIn.social({
                  provider: 'discord',
                  callbackURL: homePageUrl,
                })
              }
            >
              <Image
                alt='Discord'
                src='https://static.cdnlogo.com/logos/d/15/discord.svg'
                width={18}
                height={18}
              />
              <span className='font-medium text-gray-700'>Continue with Discord</span>
            </Button>
          </div>

          {/* Footer */}
          <div className='mt-8 pt-6 border-t border-gray-100'>
            <p className='text-xs text-gray-500 text-center'>
              Sign in to access your personalized focus dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}