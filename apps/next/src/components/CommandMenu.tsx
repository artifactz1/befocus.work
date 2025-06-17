'use client'

import { Button } from '@repo/ui/button'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@repo/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Coffee, Hash, LogOut, Moon, Pause, Play, RotateCcw, SkipBack, SkipForward, Sun, Timer, User } from 'lucide-react'
import React from 'react'
import {
  useAuthActions,
  useAutocompleteSuggestions,
  useCommandHandler,
  useCommandMenuKeyboard,
  useSettingsDialog,
  useThemeActions,
  useTimerActions
} from '~/hooks/useCommandMenuHooks'
import { useParsedCommands } from '~/hooks/useParsedCommands'
import { ClientOnly } from './helper/ClientOnly'

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  // Custom hooks
  useCommandMenuKeyboard(setOpen)
  const { isDarkMode, toggleTheme } = useThemeActions()
  const { session, isPending, handleSignOut, handleSignIn } = useAuthActions()
  const { isRunning, resetCurrentTime, skipToPrevSession, skipToNextSession, toggleTimer } = useTimerActions()
  const { workDuration: workDurationMinutes, breakDuration: breakDurationMinutes, sessions: sessionsCount, numberOnly } = useParsedCommands(searchValue)
  const autocompleteSuggestions = useAutocompleteSuggestions(searchValue)
  const {
    alertOpen,
    setAlertOpen,
    pendingUpdate,
    isSaving,
    handleSettingUpdate,
    confirmSettingUpdate,
    cancelSettingUpdate
  } = useSettingsDialog()
  const { handleCommand } = useCommandHandler(setOpen)

  // Handlers that need to close the dialog
  const handleToggleTheme = () => {
    toggleTheme()
    setOpen(false)
  }

  const handleSignOutWithClose = async () => {
    await handleSignOut()
    setOpen(false)
  }

  const handleSignInWithClose = () => {
    handleSignIn()
    setOpen(false)
  }

  const handleSettingUpdateWithClose = (type: 'work' | 'break' | 'sessions', value: number, label: string) => {
    handleSettingUpdate(type, value, label)
    setOpen(false)
  }

  const handleConfirmSettingUpdate = async () => {
    await confirmSettingUpdate()
    setSearchValue('')
  }

  const handleCancelSettingUpdate = () => {
    cancelSettingUpdate()
    setSearchValue('')
  }

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

          <CommandGroup heading="Help">
            <CommandItem disabled>
              <span className="text-muted-foreground">Try: typing &apos;set&apos; or a number to update sessions </span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup>
            {/* Autocomplete suggestions */}
            {autocompleteSuggestions.map((suggestion) => (
              <CommandItem
                key={suggestion.id}
                onSelect={() => {
                  setSearchValue(suggestion.text)
                  // Don't close the dialog, let user continue typing
                }}
                keywords={suggestion.keywords}
              >
                <Timer />
                <span>{suggestion.text}</span>
                <span className="text-muted-foreground ml-auto text-sm">
                  {suggestion.description}
                </span>
              </CommandItem>
            ))}
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
            <ClientOnly>
              {!isPending && (
                session === null ? (
                  <CommandItem onSelect={handleSignInWithClose}>
                    <User />
                    <span>Sign In</span>
                  </CommandItem>
                ) : (
                  <CommandItem onSelect={handleSignOutWithClose}>
                    <LogOut />
                    <span>Sign Out</span>
                  </CommandItem>
                )
              )}
            </ClientOnly>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Session Settings">
            <ClientOnly fallback={<div className="h-11" />}>
              <CommandItem
                disabled={!workDurationMinutes}
                keywords={['set', 'work']}
                onSelect={() => {
                  if (workDurationMinutes) {
                    handleSettingUpdateWithClose('work', workDurationMinutes, `work duration to ${workDurationMinutes} minutes`)
                  }
                }}
              >
                <Timer />
                <span>Set work duration to {workDurationMinutes || '[number]'} minutes</span>
              </CommandItem>

              <CommandItem
                disabled={!breakDurationMinutes}
                keywords={['set', 'break']}
                onSelect={() => {
                  if (breakDurationMinutes) {
                    handleSettingUpdateWithClose('break', breakDurationMinutes, `break duration to ${breakDurationMinutes} minutes`)
                  }
                }}
              >
                <Coffee />
                <span>Set break duration to {breakDurationMinutes || '[number]'} minutes</span>
              </CommandItem>

              <CommandItem
                disabled={!sessionsCount}
                keywords={['set', 'session', 'sessions']}
                onSelect={() => {
                  if (sessionsCount) {
                    handleSettingUpdateWithClose('sessions', sessionsCount, `session to ${sessionsCount}`)
                  }
                }}
              >
                <Hash />
                <span>Set sessions to total of {sessionsCount || '[number]'}</span>
              </CommandItem>

              {numberOnly && !workDurationMinutes && !breakDurationMinutes && !sessionsCount && (
                <>
                  <CommandItem onSelect={() => handleSettingUpdateWithClose('work', numberOnly, `work duration to ${numberOnly} minutes`)}>
                    <Timer />
                    <span>Set work duration to {numberOnly} minutes</span>
                  </CommandItem>

                  <CommandItem onSelect={() => handleSettingUpdateWithClose('break', numberOnly, `break duration to ${numberOnly} minutes`)}>
                    <Coffee />
                    <span>Set break duration to {numberOnly} minutes</span>
                  </CommandItem>

                  <CommandItem onSelect={() => handleSettingUpdateWithClose('sessions', numberOnly, `session total to ${numberOnly}`)}>
                    <Hash />
                    <span>Set sessions to {numberOnly}</span>
                  </CommandItem>
                </>
              )}
            </ClientOnly>
          </CommandGroup>
          <CommandSeparator />
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
            <Button variant="outline" onClick={handleCancelSettingUpdate}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSettingUpdate}
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