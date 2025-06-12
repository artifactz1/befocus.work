import { Separator } from '@repo/ui/separator'
import clsx from 'clsx'

type DividerProps = {
  className?: string
}

export default function Divider({ className }: DividerProps) {
  return <Separator className={clsx('my-4 bg-stone-400 h-0.5 dark:bg-stone-700', className)} />
}
