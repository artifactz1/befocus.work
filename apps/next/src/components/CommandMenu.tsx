// import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@repo/ui/command'
// import { DialogTitle } from '@repo/ui/dialog'
// import { CreditCard, Pause, Play, RotateCcw, Settings, SkipBack, SkipForward, User } from 'lucide-react'

// import React from 'react'
// import { useTimerStore } from '~/store/useTimerStore'

// export function CommandMenu() {
//   const { isRunning } = useTimerStore()
//   const [open, setOpen] = React.useState(false)
//   React.useEffect(() => {
//     const down = (e: KeyboardEvent) => {
//       console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey) // Debug line

//       if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
//         console.log('Command menu triggered!') // Debug line
//         e.preventDefault()
//         setOpen((open) => !open)
//       }
//     }
//     document.addEventListener("keydown", down)
//     return () => document.removeEventListener("keydown", down)
//   }, [])
//   return (
//     <>
//       {/* <p className="text-muted-foreground text-sm">
//         Press{" "}
//         <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
//           <span className="text-xs">⌘</span>J
//         </kbd>
//       </p> */}
//       <CommandDialog open={open} onOpenChange={setOpen}>
//         <DialogTitle className="p-4">
//           Command Menu
//         </DialogTitle>
//         <CommandInput placeholder="Type a command or search..." />
//         <CommandList>
//           <CommandEmpty>No results found.</CommandEmpty>

//           <CommandGroup heading="Session / Timer">
//             <CommandItem>
//               <SkipBack />
//               <span> Prev Session</span>
//             </CommandItem>
//             {isRunning ? (
//               <CommandItem>
//                 <Pause />
//                 <span> Pause Timer </span>
//               </CommandItem>
//             ) : (

//               <CommandItem>
//                 <Play className='flex flex-row' />
//                 <span> Resume Timer </span>
//               </CommandItem>

//             )}
//             <CommandItem>
//               <SkipForward />
//               <span> Next Session</span>
//             </CommandItem>
//             <CommandItem>
//               <RotateCcw />
//               <span> Reset Session</span>
//             </CommandItem>

//           </CommandGroup>


//           <CommandSeparator />
//           <CommandGroup heading="Settings">
//             <CommandItem>
//               <User />
//               <span>Profile</span>
//               <CommandShortcut>⌘P</CommandShortcut>
//             </CommandItem>
//             <CommandItem>
//               <CreditCard />
//               <span>Billing</span>
//               <CommandShortcut>⌘B</CommandShortcut>
//             </CommandItem>
//             <CommandItem>
//               <Settings />
//               <span>Settings</span>
//               <CommandShortcut>⌘S</CommandShortcut>
//             </CommandItem>
//           </CommandGroup>
//         </CommandList>
//       </CommandDialog>
//     </>
//   )
// }


import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@repo/ui/command'
import { DialogTitle } from '@repo/ui/dialog'
import { CreditCard, Pause, Play, RotateCcw, Settings, SkipBack, SkipForward, User } from 'lucide-react'
import React from 'react'
import { useTimerStore } from '~/store/useTimerStore'

export function CommandMenu() {
  const {
    isRunning,
    resetCurrentTime,
    skipToPrevSession,
    skipToNextSession,
    toggleTimer
  } = useTimerStore()

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

  const handleCommand = (action: () => void) => {
    action()
    setOpen(false) // Close the command menu after executing
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
          <CommandGroup heading="Session / Timer">
            <CommandItem onSelect={() => handleCommand(skipToPrevSession)}>
              <SkipBack />
              <span>Prev Session</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand(toggleTimer)}>
              {isRunning ? <Pause /> : <Play />}
              <span>{isRunning ? 'Pause Timer' : 'Resume Timer'}</span>
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