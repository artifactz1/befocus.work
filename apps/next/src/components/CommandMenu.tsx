'use client'

import { Button } from '@repo/ui/button'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@repo/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Coffee, Hash, LogOut, Moon, Pause, Play, RotateCcw, SkipBack, SkipForward, Sun, Timer, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useSaveUserSettings } from '~/hooks/useSession'
import { signOut, useSession } from '~/lib/auth.client'
import { useTimerStore } from '~/store/useTimerStore'
import { ClientOnly } from './helper/ClientOnly'

type PendingSettingsUpdate = {
  type: 'work' | 'break' | 'sessions'
  value: number
  label: string
} | null

export function CommandMenu() {
  const {
    isRunning,
    resetCurrentTime,
    skipToPrevSession,
    skipToNextSession,
    toggleTimer,
    updateSettings,
    reset,
    workDuration,
    breakDuration,
    sessions
  } = useTimerStore()

  const { data: session, isPending } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [alertOpen, setAlertOpen] = React.useState(false)
  const [pendingUpdate, setPendingUpdate] = React.useState<PendingSettingsUpdate>(null)

  const isDarkMode = theme === 'dark'

  React.useEffect(() => {
    console.log('Modal states:', {
      commandOpen: open,
      alertOpen,
      pendingUpdate: !!pendingUpdate
    })

    // Check for modal elements
    const radixElements = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-dialog-content]')
    console.log('Radix elements in DOM:', radixElements.length)
  }, [open, alertOpen, pendingUpdate])

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
    setOpen(false)
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

  const { mutateAsync: saveSettings, isPending: isSaving } = useSaveUserSettings()

  const handleSaveSettings = async (workTime: number, breakTime: number, sessionCount: number) => {
    try {
      await saveSettings({
        workDuration: workTime,
        breakDuration: breakTime,
        numberOfSessions: sessionCount,
      })
      // Update timer store with new settings
      updateSettings('workDuration', workTime)
      updateSettings('breakDuration', breakTime)
      updateSettings('sessions', sessionCount)
      reset()
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Parse different types of commands
  const parseWorkDurationCommand = (input: string) => {
    const patterns = [
      /^set work duration to (\d+)$/i,
      /^work duration (\d+)$/i,
      /^work (\d+)$/i,
      /^(\d+) minutes work$/i,
      /^(\d+)m work$/i,
    ]

    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match?.[0]) {
        const minutes = Number.parseInt(match[0])
        if (minutes >= 0 && minutes <= 120) {
          return minutes
        }
      }
    }
    return null
  }

  const parseBreakDurationCommand = (input: string) => {
    const patterns = [
      /^set break duration to (\d+)$/i,
      /^break duration (\d+)$/i,
      /^break (\d+)$/i,
      /^(\d+) minutes break$/i,
      /^(\d+)m break$/i,
    ]

    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match?.[0]) {
        const minutes = Number.parseInt(match[0])
        if (minutes >= 0 && minutes <= 60) {
          return minutes
        }
      }
    }
    return null
  }

  const parseSessionsCommand = (input: string) => {
    const patterns = [
      /^set sessions to (\d+)$/i,
      /^sessions (\d+)$/i,
      /^session (\d+)$/i, // Added singular form
      /^(\d+) sessions$/i,
      /^(\d+) session$/i, // Added singular form
    ]

    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match?.[0]) {
        const count = Number.parseInt(match[0])
        if (count >= 0 && count <= 20) {
          return count
        }
      }
    }
    return null
  }

  // Check if input is just a number (for work duration shortcut)
  const parseNumberOnly = (input: string) => {
    const match = input.match(/^(\d+)$/)
    if (match?.[0]) {
      const minutes = Number.parseInt(match[0])
      if (minutes >= 0 && minutes <= 120) {
        return minutes
      }
    }
    return null
  }

  const handleSettingUpdate = (type: 'work' | 'break' | 'sessions', value: number, label: string) => {
    setPendingUpdate({ type, value, label })
    setOpen(false)
    setAlertOpen(true)
  }

  const confirmSettingUpdate = async () => {
    if (!pendingUpdate) return

    const currentWorkTime = workDuration
    const currentBreakTime = breakDuration
    const currentSessions = sessions

    let newWorkTime = currentWorkTime
    let newBreakTime = currentBreakTime
    let newSessions = currentSessions

    // Update the appropriate setting
    switch (pendingUpdate.type) {
      case 'work':
        newWorkTime = pendingUpdate.value * 60 // Convert to seconds
        updateSettings('workDuration', newWorkTime)
        break
      case 'break':
        newBreakTime = pendingUpdate.value * 60 // Convert to seconds
        updateSettings('breakDuration', newBreakTime)
        break
      case 'sessions':
        newSessions = pendingUpdate.value
        updateSettings('sessions', newSessions)
        break
    }

    // Save to backend
    await handleSaveSettings(newWorkTime, newBreakTime, newSessions)

    resetCurrentTime()
    setAlertOpen(false)
    setPendingUpdate(null)
    setSearchValue('')
  }

  const cancelSettingUpdate = () => {
    setAlertOpen(false)
    setPendingUpdate(null)
    setSearchValue('')
  }

  const workDurationMinutes = parseWorkDurationCommand(searchValue)
  const breakDurationMinutes = parseBreakDurationCommand(searchValue)
  const sessionsCount = parseSessionsCommand(searchValue)
  const numberOnly = parseNumberOnly(searchValue)

  console.log(searchValue)

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="p-5">
          Command Menu
        </DialogTitle>
        <CommandInput
          placeholder="Type a command or search..."
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Session Settings">
            {/* Render all matching commands */}
            {workDurationMinutes && (
              <CommandItem onSelect={() => handleSettingUpdate('work', workDurationMinutes, `work duration to ${workDurationMinutes} minutes`)}>
                <Timer />
                <span>Set work duration to {workDurationMinutes} minutes</span>
              </CommandItem>
            )}

            {breakDurationMinutes && (
              <CommandItem onSelect={() => handleSettingUpdate('break', breakDurationMinutes, `break duration to ${breakDurationMinutes} minutes`)}>
                <Coffee />
                <span>Set break duration to {breakDurationMinutes} minutes</span>
              </CommandItem>
            )}

            {sessionsCount && (
              <CommandItem onSelect={() => handleSettingUpdate('sessions', sessionsCount, `sessions to ${sessionsCount}`)}>
                <Hash />
                <span>Set sessions to {sessionsCount}</span>
              </CommandItem>
            )}

            {/* Number-only shortcut for work duration (only if no specific work pattern matched) */}
            {numberOnly && !workDurationMinutes && (
              <CommandItem onSelect={() => handleSettingUpdate('work', numberOnly, `work duration to ${numberOnly} minutes`)}>
                <Timer />
                <span>Set work duration to {numberOnly} minutes</span>
              </CommandItem>

            )}

            {numberOnly && !breakDurationMinutes && (
              <CommandItem onSelect={() => handleSettingUpdate('break', numberOnly, `break duration to ${numberOnly} minutes`)}>
                <Timer />
                <span>Set break duration to {numberOnly} minutes</span>
              </CommandItem>

            )}

            {numberOnly && !sessionsCount && (
              <CommandItem onSelect={() => handleSettingUpdate('sessions', numberOnly, `session total to ${numberOnly}`)}>
                <Timer />
                <span>Set session {numberOnly} </span>
              </CommandItem>

            )}

            {/* Show hints only when no commands match */}
            {!workDurationMinutes && !breakDurationMinutes && !sessionsCount && !numberOnly && (
              <>
                <CommandItem disabled>
                  <Timer />
                  <span className="text-muted-foreground">Type a number to set work duration</span>
                </CommandItem>
                <CommandItem disabled>
                  <Coffee />
                  <span className="text-muted-foreground">Try: break 9 for break duration</span>
                </CommandItem>
                <CommandItem disabled>
                  <Hash />
                  <span className="text-muted-foreground">Try: session 3 for session count</span>
                </CommandItem>
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

            <ClientOnly fallback={<div className="h-11" />}>
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
              <span className="text-muted-foreground">Try: work 24 or just 25</span>
            </CommandItem>
            <CommandItem disabled>
              <span className="text-muted-foreground">Try: break 4 or session 4</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your current
              session and update your {pendingUpdate?.label}! Make sure this is what you want before continuing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelSettingUpdate}>
              Cancel
            </Button>
            <Button
              onClick={confirmSettingUpdate}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}