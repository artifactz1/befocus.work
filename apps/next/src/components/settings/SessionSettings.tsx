'use client'

import { Button } from '@repo/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/tooltip'
import { Timer } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/alert-dialog'
import { useEffect, useState } from 'react'
import { useSaveUserSettings, useUserSettings } from '~/hooks/useSession'
import { useTimerStore } from '~/store/useTimerStore'
import Divider from '../helper/Divider'
import MenuButton from '../helper/MenuButtons'
import { BreakDurationInput } from '../input/BreakDurationInput'
import { SessionsInput } from '../input/SessionsInput'
import { WorkDurationInput } from '../input/WorkDurationInput'

export const SessionSettings: React.FC = () => {
  const [workTime, setWorkTime] = useState(25 * 60)
  const [breakTime, setBreakTime] = useState(5 * 60)
  const [session, setSession] = useState(6)

  const { reset, updateSettings } = useTimerStore()
  const { data: userSettings, isLoading } = useUserSettings()
  const { mutateAsync: saveSettings, isPending: isSaving } = useSaveUserSettings()

  // Update local state when user settings are loaded
  useEffect(() => {
    if (userSettings) {
      setWorkTime(userSettings.workDuration)
      setBreakTime(userSettings.breakDuration)
      setSession(userSettings.numberOfSessions)
    }
  }, [userSettings])

  const handleSaveSettings = async () => {
    try {
      await saveSettings({
        workDuration: workTime,
        breakDuration: breakTime,
        numberOfSessions: session,
      })
      // Update timer store with new settings
      updateSettings('workDuration', workTime)
      updateSettings('breakDuration', breakTime)
      updateSettings('sessions', session)
      reset()
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to save settings:', error)
    }
  }

  return (
    <TooltipProvider>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <MenuButton>
                <Timer />
              </MenuButton>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="font-bold" side="top" sideOffset={8}>
            <p>Open Session Settings</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent
          align='end'
          className='h-full w-[90vw] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 sm:-mr-[110px] sm:w-[392px] md:-mr-[138px] lg:ml-0 lg:mr-0'
        >
          <div className='flex h-full w-full select-none flex-col justify-end'>
            <div className='mb-2 mt-4 text-lg font-bold'>befocus/sessions-settings</div>
            <Divider />

            <div className='flex flex-col space-y-6'>
              <div>
                <WorkDurationInput value={workTime / 60} onChange={value => setWorkTime(value)} />
                <BreakDurationInput value={breakTime / 60} onChange={value => setBreakTime(value)} />
                <SessionsInput value={session} onChange={value => setSession(value)} />
              </div>

              <div className='flex w-full justify-end'>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isSaving || isLoading}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your current
                        session! Make sure to change your sessions settings before starting.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}