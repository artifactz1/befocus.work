'use client'

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@repo/ui/command'
import { DialogTitle } from '@repo/ui/dialog'
import { CreditCard, LogOut, Moon, Pause, Play, RotateCcw, Settings, SkipBack, SkipForward, Sun, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import React from 'react'
import { signOut, useSession } from '~/lib/auth.client'
import { useTimerStore } from '~/store/useTimerStore'
import { ClientOnly } from './ClientOnly'

export function CommandMenu() {
  const {
    isRunning,
    resetCurrentTime,
    skipToPrevSession,
    skipToNextSession,
    toggleTimer
  } = useTimerStore()

  const { data: session, isPending } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  const isDarkMode = theme === 'dark'

  // Ensure component is mounted before rendering session-dependent UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

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

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="p-4">
          Command Menu
        </DialogTitle>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Timer">
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

            {/* Only render auth-related items after component is mounted and session status is determined */}
            {/* <ClientOnly > */}
            <ClientOnly fallback={<div className="h-10" />}>
              {mounted && !isPending && (
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

          <CommandGroup heading="Settings">
            <CommandItem>
              <User />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <CreditCard />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <Settings />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}