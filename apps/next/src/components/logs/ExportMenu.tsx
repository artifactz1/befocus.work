'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'
import { cn } from '@repo/ui/lib/utils'
import { ChevronDown, Copy, Download, Share, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { exportFileName, toMarkdown, toText } from '~/lib/logs/export'
import { makeFormat, type Summary } from '~/lib/logs/summary'

const COPY_FAILED = "Couldn't copy. Your browser blocked clipboard access."

const itemClass =
  'h-10 gap-2 rounded-lg px-3 text-[15px] focus:bg-white/[0.08] focus:text-foreground [@media(pointer:coarse)]:h-11'

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast(done)
  } catch {
    toast(COPY_FAILED)
  }
}

function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function ExportMenu({
  summary,
  side = 'top',
  className,
}: {
  summary: Summary
  side?: 'top' | 'bottom'
  className?: string
}) {
  // navigator.share is only known in the browser, so the item appears after mount.
  const [canShare, setCanShare] = useState(false)
  useEffect(() => setCanShare(typeof navigator.share === 'function'), [])

  const md = () => toMarkdown(summary, makeFormat())
  const txt = () => toText(summary, makeFormat())

  const share = async () => {
    try {
      await navigator.share({ title: 'Focus session', text: txt() })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      await copy(md(), 'Copied as Markdown')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.14] bg-transparent px-4 text-[15px] font-normal text-foreground outline-none hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:bg-white/[0.08] [@media(pointer:coarse)]:h-11',
          className,
        )}
      >
        <Upload aria-hidden='true' className='size-4' />
        Export
        <ChevronDown aria-hidden='true' className='size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align='start'
        sideOffset={8}
        className='w-[260px] rounded-xl border-white/10 bg-[color-mix(in_srgb,var(--bg-solid),#fff_7%)] p-1 shadow-[0_24px_60px_rgb(0_0_0/0.5)] motion-reduce:animate-none max-lg:w-[var(--radix-dropdown-menu-trigger-width)]'
      >
        <DropdownMenuItem className={itemClass} onSelect={() => void copy(txt(), 'Copied as text')}>
          <Copy aria-hidden='true' className='size-4 text-muted-foreground' />
          Copy as text
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          onSelect={() => void copy(md(), 'Copied as Markdown')}
        >
          <Copy aria-hidden='true' className='size-4 text-muted-foreground' />
          Copy as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          onSelect={() =>
            download(
              `${md()}\n`,
              exportFileName(summary.start, 'md', makeFormat()),
              'text/markdown',
            )
          }
        >
          <Download aria-hidden='true' className='size-4 text-muted-foreground' />
          Download .md
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          onSelect={() =>
            download(`${txt()}\n`, exportFileName(summary.start, 'txt', makeFormat()), 'text/plain')
          }
        >
          <Download aria-hidden='true' className='size-4 text-muted-foreground' />
          Download .txt
        </DropdownMenuItem>
        {canShare && (
          <DropdownMenuItem className={itemClass} onSelect={() => void share()}>
            <Share aria-hidden='true' className='size-4 text-muted-foreground' />
            Share
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
