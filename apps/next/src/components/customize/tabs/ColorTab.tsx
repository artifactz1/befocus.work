'use client'

import { Slider } from '@repo/ui/slider'
import { useCustomizeStore } from '~/store/useCustomizeStore'

const SWATCHES: Array<{ id: string; hsl: string }> = [
  { id: 'stone', hsl: 'hsl(30 5% 60%)' },
  { id: 'sage', hsl: 'hsl(120 12% 55%)' },
  { id: 'rose', hsl: 'hsl(355 55% 65%)' },
  { id: 'sand', hsl: 'hsl(35 35% 70%)' },
  { id: 'sky', hsl: 'hsl(210 50% 65%)' },
  { id: 'lavender', hsl: 'hsl(265 30% 65%)' },
  { id: 'amber', hsl: 'hsl(30 70% 55%)' },
  { id: 'pine', hsl: 'hsl(155 30% 40%)' },
  { id: 'crimson', hsl: 'hsl(355 70% 50%)' },
  { id: 'ink', hsl: 'hsl(220 15% 25%)' },
  { id: 'cream', hsl: 'hsl(45 60% 88%)' },
  { id: 'coal', hsl: 'hsl(0 0% 12%)' },
]

export default function ColorTab() {
  const accent = useCustomizeStore(s => s.preview.color.accent)
  const contrast = useCustomizeStore(s => s.preview.color.contrast)
  const setPreview = useCustomizeStore(s => s.setPreview)

  // setPreview deep-merges nested objects, so we can patch single fields safely.
  const setAccent = (hsl: string) => setPreview({ color: { accent: hsl } })
  const setContrast = (val: number) => setPreview({ color: { contrast: val } })

  return (
    <div className='flex flex-col gap-5'>
      <section className='flex flex-col gap-2'>
        <span className='text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground/70'>
          Accent
        </span>
        <div role='radiogroup' aria-label='Accent color' className='flex flex-wrap gap-2'>
          {SWATCHES.map(s => {
            const selected = s.hsl === accent
            return (
              <button
                key={s.id}
                type='button'
                role='radio'
                aria-checked={selected}
                aria-label={s.id}
                tabIndex={selected ? 0 : -1}
                onClick={() => setAccent(s.hsl)}
                style={{ background: s.hsl }}
                className={`h-8 w-8 rounded-full border transition-all ${
                  selected
                    ? 'scale-110 border-foreground/80 ring-2 ring-foreground/30 ring-offset-2 ring-offset-background'
                    : 'border-border/60 hover:scale-105'
                }`}
              />
            )
          })}
        </div>
      </section>

      <section className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <span className='text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground/70'>
            Contrast
          </span>
          <span className='text-[10px] tabular-nums text-muted-foreground'>
            {Math.round(contrast * 100)}%
          </span>
        </div>
        <Slider
          value={[contrast]}
          min={0.6}
          max={1}
          step={0.02}
          onValueChange={([v]) => {
            if (v !== undefined) setContrast(v)
          }}
        />
      </section>
    </div>
  )
}
