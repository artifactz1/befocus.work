'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import MenuButton from './helper/MenuButtons'
import { useTheme } from 'next-themes'

export const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      setIsDarkMode(theme === 'dark')
    }
  }, [mounted, theme])

  const handleToggle = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark'
    setTheme(nextTheme)
    setIsDarkMode(!isDarkMode)
  }

  if (!mounted) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <MenuButton
            onClick={handleToggle}
            variant='outline'
            size='lg'
            className='lg:w-24 lg:h-12 xl:h-12 xl:w-32'
          >
            {isDarkMode ? <Sun strokeWidth={3} /> : <Moon strokeWidth={3} />}
          </MenuButton>
        </TooltipTrigger>
        <TooltipContent className='font-bold'>
          Toggle {isDarkMode ? ' Light Mode' : ' Dark Mode'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
