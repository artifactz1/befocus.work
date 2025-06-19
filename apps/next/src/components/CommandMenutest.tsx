"use client"

import * as React from "react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@repo/ui/command"
import { DialogTitle } from '@repo/ui/dialog'
import { LogOut, Moon, Sun, Timer, User } from 'lucide-react'
import { useAutocompleteSuggestions, useClientAuthActions, useCommandHandler, useThemeActions } from '~/hooks/useCommandMenuHooks'
import { ClientOnly } from './helper/ClientOnly'
import { CommandDialogContent } from './CommandDialogContent'

export default function CommandDialogTest() {
  
  return (
    <>
      <ClientOnly fallback={null}>
        <CommandDialogContent/>
      
      </ClientOnly>
    </>
  )
}
