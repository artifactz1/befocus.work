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
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '~/lib/api.client'
import { useTimerStore } from '~/store/useTimerStore'
import Divider from '../helper/Divider'
import MenuButton from '../helper/MenuButtons'
import { BreakDurationInput } from '../input/BreakDurationInput'
import { SessionsInput } from '../input/SessionsInput'
import { WorkDurationInput } from '../input/WorkDurationInput'

type UserSettings = {
  workDuration: number
  breakDuration: number
  numberOfSessions: number
  userId: string
  id: string
}

export const SessionSettings: React.FC = () => {
  const [workTime, setWorkTime] = useState(25 * 60)
  const [breakTime, setBreakTime] = useState(5 * 60)
  const [session, setSession] = useState(6)

  const { reset, updateSettings } = useTimerStore()

  const { data } = useQuery<UserSettings | null>({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const response = await api.user.settings.$get()
      if (!response.ok) return null

      const res = await response.json()
      setWorkTime(res.workDuration)
      setBreakTime(res.breakDuration)
      setSession(res.numberOfSessions)

      return res
    },
  })

  useEffect(() => {
    if (data) {
      setWorkTime(data.workDuration)
      setBreakTime(data.breakDuration)
      setSession(data.numberOfSessions)
    }
  }, [data])

  async function userSettingCreate() {
    const response = await api.user.settings.$post({
      json: {
        workDuration: workTime,
        breakDuration: breakTime,
        numberOfSessions: session,
      },
    })
    if (!response.ok) return null
    return await response.json()
  }

  async function userSettingUpdate() {
    const response = await api.user.settings.$put({
      json: {
        workDuration: workTime,
        breakDuration: breakTime,
        numberOfSessions: session,
      },
    })
    if (!response.ok) return null
  }

  const { mutateAsync: createSettings } = useMutation({
    mutationKey: ['userSettings'],
    mutationFn: userSettingCreate,
  })

  const { mutateAsync: saveSettings } = useMutation({
    mutationKey: ['userSettings'],
    mutationFn: async () => {
      if (!data) return await createSettings()
      return await userSettingUpdate()
    },
    onSuccess: () => {
      toast('Session Settings has been saved', {
        description: 'Your preferences have been updated.',
      })
    },
    onError: error => {
      toast.error('Failed to save settings')
      console.error('Error saving settings:', error)
    },
  })

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
                    <Button>Save</Button>
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
                        onClick={() => {
                          saveSettings()
                          updateSettings('workDuration', workTime)
                          updateSettings('breakDuration', breakTime)
                          updateSettings('sessions', session)
                          reset()
                          toast('Session Settings has been saved', {
                            description: 'Your preferences have been updated.',
                          })
                        }}
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
