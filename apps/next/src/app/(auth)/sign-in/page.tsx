'use client'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import Image from 'next/image'
import { signIn } from '~/lib/auth.client'

export default function SignIn() {
  const homePageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/`

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>Welcome to Be Focus</CardTitle>
            <CardDescription>
              Sign in to continue to your dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4 '>
            <Button
              variant='outline'
              className='flex items-center justify-center gap-3 w-full h-11'
              onClick={() => signIn.social({ provider: 'github', callbackURL: homePageUrl })}
            >
              <Image
                alt='GitHub'
                src='https://www.cdnlogo.com/logos/g/69/github-icon.svg'
                width={18}
                height={18}
                className="dark:border dark:border-white dark:rounded-3xl dark:bg-white"
              />
              Continue with GitHub
            </Button>

            <Button
              variant='outline'
              className='flex items-center justify-center gap-3 w-full h-11'
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
              Continue with Google
            </Button>

            <Button
              variant='outline'
              className='flex items-center justify-center gap-3 w-full h-11'
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
              Continue with Discord
            </Button>

            <div className='pt-4 border-t'>
              <p className='text-xs text-muted-foreground text-center'>
                Sign in to access your personalized focus dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
