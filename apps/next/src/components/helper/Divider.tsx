import { Separator } from '@repo/ui/separator'
import React from 'react'
import clsx from 'clsx'

type DividerProps = { 
  className?: string
}

export default function Divider({className} : DividerProps) {
  return <Separator className={clsx('my-4 bg-black dark:bg-white', className)}/>
}
