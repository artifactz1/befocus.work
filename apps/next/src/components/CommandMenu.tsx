'use client'

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@repo/ui/command'
import { DialogTitle } from '@repo/ui/dialog'
import { LogOut, Moon, Pause, Play, RotateCcw, SkipBack, SkipForward, Sun, Timer, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import React from 'react'
import { signOut, useSession } from '~/lib/auth.client'
import { useTimerStore } from '~/store/useTimerStore'
import { ClientOnly } from './helper/ClientOnly'

export function CommandMenu() {
  const {
    isRunning,
    resetCurrentTime,
    skipToPrevSession,
    skipToNextSession,
    toggleTimer,
    updateSettings
  } = useTimerStore()

  const { data: session, isPending } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  const isDarkMode = theme === 'dark'

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleCommand = (action: () => void) => {
    action()
    setOpen(false) // Close the command menu after executing
  }

  const handleToggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark')
    setOpen(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
      setOpen(false)
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }

  const handleSignIn = () => {
    router.push('/sign-in')
    setOpen(false)
  }

  // Parse work duration command
  const parseWorkDurationCommand = (input: string) => {
    const patterns = [
      /^set work duration to (\d+)$/i,
      /^work duration (\d+)$/i,
      /^work (\d+)$/i,
      /^(\d+) minutes work$/i,
      /^(\d+)m work$/i,
      /^(\d+)$/
    ]

    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match?.[1]) {
        const minutes = Number.parseInt(match[1])
        if (minutes >= 1 && minutes <= 120) { // Reasonable limits
          return minutes
        }
      }
    }
    return null
  }

  const handleSetWorkDuration = (minutes: number) => {
    const seconds = minutes * 60
    updateSettings('workDuration', seconds)
    resetCurrentTime()
    setOpen(false)
    setSearchValue('')
  }

  const workDurationMinutes = parseWorkDurationCommand(searchValue)

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="p-4">
          Command Menu
        </DialogTitle>
        <CommandInput
          placeholder="Type a command or search..."
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Session">
            {workDurationMinutes ? (
              <CommandItem onSelect={() => handleSetWorkDuration(workDurationMinutes)}>
                <Timer />
                <span>Set work duration to {workDurationMinutes} minutes</span>
              </CommandItem>
            ) : (
              <>
                <CommandItem >
                  <Timer />
                  <span className="text-muted-foreground">Type a number to set work duration</span>
                </CommandItem>
                {/* You could add other session-related commands here */}
              </>
            )}
          </CommandGroup>

          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => handleCommand(skipToPrevSession)}>
              <SkipBack />
              <span>Previous Session</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand(toggleTimer)}>
              {isRunning ? <Pause /> : <Play />}
              <span>{isRunning ? 'Pause Timer' : 'Start Timer'}</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand(skipToNextSession)}>
              <SkipForward />
              <span>Next Session</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand(resetCurrentTime)}>
              <RotateCcw />
              <span>Reset Session</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Account">
            <CommandItem onSelect={handleToggleTheme}>
              {isDarkMode ? <Sun /> : <Moon />}
              <span>{isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </CommandItem>

            <ClientOnly fallback={<div className="h-10" />}>
              {!isPending && (
                session === null ? (
                  <CommandItem onSelect={handleSignIn}>
                    <User />
                    <span>Sign In</span>
                  </CommandItem>
                ) : (
                  <CommandItem onSelect={handleSignOut}>
                    <LogOut />
                    <span>Sign Out</span>
                  </CommandItem>
                )
              )}
            </ClientOnly>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Help">
            <CommandItem disabled>
              <span className="text-muted-foreground">Try: &apos;set work duration to 25&apos;</span>
            </CommandItem>
            <CommandItem disabled>
              <span className="text-muted-foreground">Or just type: &apos;30&apos; for 30 minutes</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}