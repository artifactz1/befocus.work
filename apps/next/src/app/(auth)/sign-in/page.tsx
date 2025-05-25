'use client'

import { Button } from '@repo/ui/button'
import Image from 'next/image'
import { signIn } from '~/lib/auth.client'

export default function SignIn() {
  const homePageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

  return (
    <div className='flex flex-col items-center justify-center h-full gap-10'>
      <h1 className='text-4xl font-bold'>BeFocus</h1>
      <div>
        <div className='flex flex-col gap-12 flex-1 items-center justify-center h-full max-w-sm w-80'>
          <Button
            className='flex gap-2 w-full'
            onClick={() => signIn.social({ provider: 'github', callbackURL: homePageUrl })}
          >
            <Image
              alt='GitHub Logo'
              src={'https://www.cdnlogo.com/logos/g/69/github-icon.svg'}
              width={20}
              height={20}
            />
            Github SignIn
          </Button>
          <Button
            className='flex gap-2 w-full'
            onClick={() =>
              signIn.social({
                provider: 'google',
                callbackURL: homePageUrl,
              })
            }
          >
            <Image
              alt='Google Logo'
              src={'https://www.cdnlogo.com/logos/g/35/google-icon.svg'}
              width={20}
              height={20}
            />
            Google SignIn
          </Button>
          <Button
            className='flex gap-2 w-full'
            onClick={() =>
              signIn.social({
                provider: 'discord',
                callbackURL: homePageUrl,
              })
            }
          >
            <Image
              alt='Discord'
              src={'https://static.cdnlogo.com/logos/d/15/discord.svg'}
              width={20}
              height={20}
            />
            Discord SignIn
          </Button>
        </div>
      </div>
    </div>
  )
}
