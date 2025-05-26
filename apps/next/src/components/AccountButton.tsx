import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut, useSession } from '~/lib/auth.client'
import MenuButton from './helper/MenuButtons'

export default function AccountButton() {
  const { data } = useSession()
  // const iconSize = "md:h-5 xl:h-6";
  const router = useRouter()
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const buttonVariant = isSmallScreen ? 'ghost' : 'outline'

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768) // 'sm' breakpoint is 640px
    }

    handleResize() // Set initial state
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  console.log('USER DATA', data)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }

  return (
    <div>
      {data === null ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <MenuButton
                onClick={() => router.push('/sign-in')}
                variant={buttonVariant}
                className='xl:h-12 xl:w-32'
              >
                {/* <User className={iconSize} strokeWidth={3} /> */}
                Sign In
              </MenuButton>
            </TooltipTrigger>
            <TooltipContent className='font-bold'>Sign In</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        // <TooltipProvider>
        //   <Tooltip>
        //     <TooltipTrigger asChild>
        //       <MenuButton
        //         className="xl:h-12 xl:w-32"
        //       >

        //       </MenuButton>
        //     </TooltipTrigger>
        //     <TooltipContent className="font-bold">
        //       Sign In
        //     </TooltipContent>
        //   </Tooltip>
        // </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger className='xl:h-12 xl:w-32' asChild>
            <MenuButton className='xl:h-12 xl:w-32' variant='outline'>
              <User />
            </MenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
