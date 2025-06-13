import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@repo/ui/command'
import { DialogTitle } from '@repo/ui/dialog'
import { CreditCard, Pause, Play, RotateCcw, Settings, SkipBack, SkipForward, User } from 'lucide-react'

import React from 'react'
import { useTimerStore } from '~/store/useTimerStore'

export function CommandMenu() {
  const { isRunning } = useTimerStore()
  const [open, setOpen] = React.useState(false)
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
  return (
    <>
      {/* <p className="text-muted-foreground text-sm">
        Press{" "}
        <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </p> */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="p-4">
          Command Menu
        </DialogTitle>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Session / Timer">
            <CommandItem>
              <SkipBack />
              <span> Prev Session</span>
            </CommandItem>
            {isRunning ? (
              <CommandItem>
                <Pause />
                <span> Resume Timer </span>
              </CommandItem>
            ) : (
              <CommandItem>
                <Play className='flex flex-row' />
                <span> Pause Timer </span>
              </CommandItem>

            )}
            <CommandItem>
              <SkipForward />
              <span> Next Session</span>
            </CommandItem>
            <CommandItem>
              <RotateCcw />
              rotate-ccw
              <span> Reset Session</span>
            </CommandItem>

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


