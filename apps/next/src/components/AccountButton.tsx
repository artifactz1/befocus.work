'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/tooltip'
import { LogOut, Moon, Sun, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut, useSession } from '~/lib/auth.client'
// import { DarkModeToggle } from './DarkModeToggle'
import MenuButton from './helper/MenuButtons'

export default function AccountButton() {
  const { data } = useSession()
  const router = useRouter()
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  const buttonVariant = isSmallScreen ? 'ghost' : 'outline'
  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  const handleToggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
  }

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }

  if (data === null) {
    // User is NOT signed in
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <MenuButton
              onClick={() => router.push('/sign-in')}
              variant={buttonVariant}
              className='xl:h-12 xl:w-32'
            >
              Sign In
            </MenuButton>
          </TooltipTrigger>
          <TooltipContent className='font-bold'>Sign In</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // User IS signed in
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MenuButton className='xl:h-12 xl:w-32' variant={buttonVariant}>
                <User />
              </MenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem>
                Toggle Dark Mode
                <DarkModeToggle />
              </DropdownMenuItem> */}

              <DropdownMenuItem onClick={handleToggleTheme} className='flex justify-between items-center gap-2'>
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className='flex justify-between items-center'>
                Sign Out
                <LogOut className="h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent className='font-bold'>Account</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
