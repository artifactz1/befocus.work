'use client'

export default function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className='flex items-center justify-center py-6 text-xs text-muted-foreground'>
      {name} controls — coming in Plan 2
    </div>
  )
}
