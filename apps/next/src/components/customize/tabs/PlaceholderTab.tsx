'use client'

export default function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className='flex h-full min-h-[140px] flex-col items-center justify-center gap-2 text-center'>
      <span className='text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground/60'>
        {name}
      </span>
      <span className='text-sm text-muted-foreground/80'>Coming soon</span>
    </div>
  )
}
