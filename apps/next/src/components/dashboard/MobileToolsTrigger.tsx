'use client'

import { Button } from '@repo/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/drawer'
import { ListTodo, Music, Settings2, User, Volume2 } from 'lucide-react'
import { useState } from 'react'
import AccountButton from '~/components/AccountButton'
import SessionSettingsMobile from '~/components/settings/SessionSettingsMobile'
import SoundSettingsMobile from '~/components/settings/SoundSettingsMobile'
import ToDoListMobile from '~/components/to-do-list/ToDoListMobile'
import { useCustomizeStore } from '~/store/useCustomizeStore'

export default function MobileToolsTrigger() {
  const [open, setOpen] = useState(false)
  const openCustomize = useCustomizeStore(s => s.open)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Tools'
          className='fixed bottom-6 left-6 z-30 h-12 w-12 rounded-full border border-border/40 bg-card/50 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-md sm:hidden'
        >
          <Settings2 className='h-5 w-5' />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Tools</DrawerTitle>
          <DrawerDescription className='sr-only'>App tools and settings</DrawerDescription>
        </DrawerHeader>
        <div className='flex flex-col gap-1 p-4 pb-8'>
          <ToolRow icon={<ListTodo className='h-5 w-5' />} label='To-do'>
            <ToDoListMobile />
          </ToolRow>
          <ToolRow icon={<Volume2 className='h-5 w-5' />} label='Sounds'>
            <SoundSettingsMobile />
          </ToolRow>
          <ToolRow icon={<Music className='h-5 w-5' />} label='Sessions'>
            <SessionSettingsMobile />
          </ToolRow>
          <ToolRow icon={<Settings2 className='h-5 w-5' />} label='Customize'>
            <Button
              variant='outline'
              size='lg'
              onClick={() => {
                setOpen(false)
                openCustomize()
              }}
            >
              Open
            </Button>
          </ToolRow>
          <ToolRow icon={<User className='h-5 w-5' />} label='Account'>
            <AccountButton />
          </ToolRow>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function ToolRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between rounded-md px-3 py-3'>
      <div className='flex items-center gap-3'>
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  )
}
