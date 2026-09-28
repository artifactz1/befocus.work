'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { LogOut, Moon, Sun, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { signOut, useSession } from '~/lib/auth.client'
import MenuButton from './helper/MenuButtons'

export default function AccountButton() {
  const { data } = useSession()
  const router = useRouter()

  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  const handleToggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MenuButton className='xl:h-12 xl:w-32'>
                {data === null ? <div> Sign In</div> : <User />}
              </MenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleToggleTheme}
                className='flex justify-between items-center gap-2'
              >
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                {isDarkMode ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
              </DropdownMenuItem>
              {data === null ? (
                <DropdownMenuItem
                  onClick={() => router.push('/sign-in')}
                  className='flex justify-between items-center'
                >
                  Sign In
                  <LogOut className='h-4 w-4' />
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className='flex justify-between items-center'
                >
                  Sign Out
                  <LogOut className='h-4 w-4' />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent className='font-bold'>Account</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
