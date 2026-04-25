'use client'

import { motion } from 'framer-motion'
import { signIn } from '~/lib/auth.client'

const SUPREME = 'Supreme, ui-serif, Georgia, serif'

const providers = [
  {
    id: 'github' as const,
    label: 'GitHub',
    icon: (
      <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' fill='currentColor' aria-hidden>
        <path d='M12 .5C5.65.5.5 5.65.5 12.02c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.4-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z' />
      </svg>
    ),
  },
  {
    id: 'google' as const,
    label: 'Google',
    icon: (
      <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' aria-hidden>
        <path
          fill='#EA4335'
          d='M12 10.2v3.9h5.5c-.24 1.45-1.7 4.25-5.5 4.25-3.31 0-6.01-2.74-6.01-6.12s2.7-6.12 6.01-6.12c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.83 3.6 14.6 2.6 12 2.6 6.86 2.6 2.7 6.76 2.7 11.9S6.86 21.2 12 21.2c6.93 0 9.3-4.86 9.3-7.97 0-.54-.06-.96-.13-1.37H12z'
        />
      </svg>
    ),
  },
  {
    id: 'discord' as const,
    label: 'Discord',
    icon: (
      <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' fill='currentColor' aria-hidden>
        <path d='M20.317 4.369A19.79 19.79 0 0 0 16.558 3a14.45 14.45 0 0 0-.706 1.45 18.27 18.27 0 0 0-5.486 0A14.46 14.46 0 0 0 9.66 3a19.74 19.74 0 0 0-3.762 1.37C2.79 9.046 1.95 13.58 2.37 18.05a19.9 19.9 0 0 0 6.073 3.07c.49-.67.927-1.39 1.302-2.144a13 13 0 0 1-2.052-.984c.172-.127.34-.26.503-.397 3.95 1.83 8.224 1.83 12.124 0 .165.137.333.27.504.397a13 13 0 0 1-2.057.987c.376.752.812 1.473 1.302 2.143a19.87 19.87 0 0 0 6.077-3.07c.493-5.183-.838-9.677-3.83-13.683zM9.545 15.413c-1.21 0-2.21-1.117-2.21-2.488s.978-2.49 2.21-2.49c1.232 0 2.231 1.118 2.21 2.49 0 1.371-.978 2.488-2.21 2.488zm4.91 0c-1.21 0-2.21-1.117-2.21-2.488s.979-2.49 2.21-2.49c1.231 0 2.231 1.118 2.21 2.49 0 1.371-.979 2.488-2.21 2.488z' />
      </svg>
    ),
  },
] as const

const ease = [0.22, 1, 0.36, 1] as const

export default function SignIn() {
  const homePageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/`

  return (
    <div
      className='relative min-h-screen w-full overflow-hidden bg-background text-foreground'
      style={{ fontFamily: SUPREME }}
    >
      {/* Grain overlay */}
      <svg
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-[0.06] mix-blend-overlay'
      >
        <filter id='grain'>
          <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' />
          <feColorMatrix type='saturate' values='0' />
        </filter>
        <rect width='100%' height='100%' filter='url(#grain)' />
      </svg>

      {/* Soft radial atmosphere */}
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[0]'
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 75% 40%, hsl(var(--accent) / 0.12), transparent 70%), radial-gradient(ellipse 50% 40% at 15% 90%, hsl(var(--muted) / 0.18), transparent 70%)',
        }}
      />

      {/* Watermark numeral */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease, delay: 0.6 }}
        className='pointer-events-none absolute -bottom-12 -right-6 z-[1] select-none leading-none'
        style={{
          fontFamily: SUPREME,
          fontWeight: 200,
          fontStyle: 'italic',
          fontSize: 'clamp(14rem, 28vw, 30rem)',
          color: 'hsl(var(--foreground) / 0.04)',
          letterSpacing: '-0.04em',
        }}
      >
        25
      </motion.div>

      {/* Vertical sidebar label */}
      <div
        className='absolute left-6 top-1/2 z-[2] hidden -translate-y-1/2 -rotate-90 origin-left text-[10px] uppercase tracking-[0.4em] text-muted-foreground md:block'
        style={{ fontFamily: SUPREME, fontWeight: 500 }}
      >
        Vol. 01 — A Focus Almanac
      </div>

      {/* Top bar */}
      <header className='relative z-[3] flex items-center justify-between px-8 pt-8 md:px-16 md:pt-10'>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className='flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-muted-foreground'
          style={{ fontFamily: SUPREME, fontWeight: 500 }}
        >
          <span className='inline-block h-[6px] w-[6px] rounded-full bg-foreground' />
          Be Focus
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.05 }}
          className='text-[11px] uppercase tracking-[0.32em] text-muted-foreground'
          style={{ fontFamily: SUPREME, fontWeight: 500 }}
        >
          Est. 2025
        </motion.div>
      </header>

      {/* Main composition */}
      <main className='relative z-[3] mx-auto grid min-h-[calc(100vh-12rem)] max-w-7xl grid-cols-1 items-center gap-16 px-8 py-16 md:grid-cols-12 md:gap-8 md:px-16'>
        {/* Editorial column */}
        <section className='md:col-span-7'>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.15 }}
            className='mb-8 text-[11px] uppercase tracking-[0.4em] text-muted-foreground'
            style={{ fontFamily: SUPREME, fontWeight: 500 }}
          >
            Session — 01 / Sign in
          </motion.p>

          <h1
            className='leading-[0.92] tracking-[-0.04em]'
            style={{
              fontFamily: SUPREME,
              fontSize: 'clamp(3.5rem, 9vw, 8rem)',
            }}
          >
            {['Quiet', 'focus,', 'deep', 'work.'].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease, delay: 0.25 + i * 0.08 }}
                className='block'
                style={{
                  fontWeight: i === 1 ? 200 : 400,
                  fontStyle: i === 1 ? 'italic' : 'normal',
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.7 }}
            className='mt-10 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg'
            style={{ fontFamily: SUPREME, fontWeight: 300 }}
          >
            A simple ritual — twenty-five minutes at a time. Sign in to keep your sessions, sounds, and tasks in sync wherever you are.
          </motion.p>
        </section>

        {/* Sign-in column */}
        <aside className='relative md:col-span-5'>
          {/* Decorative timer ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease, delay: 0.4 }}
            className='pointer-events-none absolute -right-24 -top-24 hidden md:block'
            aria-hidden
          >
            <motion.svg
              width='340'
              height='340'
              viewBox='0 0 340 340'
              animate={{ rotate: 360 }}
              transition={{ duration: 120, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
            >
              <circle
                cx='170'
                cy='170'
                r='160'
                fill='none'
                stroke='hsl(var(--foreground) / 0.12)'
                strokeWidth='1'
              />
              <circle
                cx='170'
                cy='170'
                r='160'
                fill='none'
                stroke='hsl(var(--foreground) / 0.6)'
                strokeWidth='1'
                strokeDasharray='2 14'
                strokeLinecap='round'
              />
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
                const x1 = 170 + Math.cos(angle) * 148
                const y1 = 170 + Math.sin(angle) * 148
                const x2 = 170 + Math.cos(angle) * (i % 3 === 0 ? 132 : 142)
                const y2 = 170 + Math.sin(angle) * (i % 3 === 0 ? 132 : 142)
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke='hsl(var(--foreground) / 0.45)'
                    strokeWidth={i % 3 === 0 ? 1.2 : 0.8}
                    strokeLinecap='round'
                  />
                )
              })}
            </motion.svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.55 }}
            className='relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]'
          >
            {/* Inner divider header */}
            <div className='flex items-center justify-between border-b border-border/50 px-6 py-5'>
              <span
                className='text-[10px] uppercase tracking-[0.36em] text-muted-foreground'
                style={{ fontFamily: SUPREME, fontWeight: 500 }}
              >
                Begin Session
              </span>
              <span
                className='text-[10px] tabular-nums text-muted-foreground'
                style={{ fontFamily: SUPREME, fontWeight: 400 }}
              >
                25 : 00
              </span>
            </div>

            {/* Provider rows */}
            <ul className='divide-y divide-border/50'>
              {providers.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease, delay: 0.75 + i * 0.07 }}
                >
                  <button
                    type='button'
                    onClick={() => signIn.social({ provider: p.id, callbackURL: homePageUrl })}
                    className='group flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none'
                    style={{ fontFamily: SUPREME }}
                  >
                    <span className='flex items-center gap-4'>
                      <span className='flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-foreground transition-colors group-hover:bg-foreground/10'>
                        {p.icon}
                      </span>
                      <span className='flex flex-col'>
                        <span
                          className='text-[10px] uppercase tracking-[0.32em] text-muted-foreground'
                          style={{ fontWeight: 500 }}
                        >
                          Continue with
                        </span>
                        <span className='text-base text-foreground' style={{ fontWeight: 500 }}>
                          {p.label}
                        </span>
                      </span>
                    </span>
                    <span
                      className='translate-x-0 text-foreground/60 transition-all group-hover:translate-x-1 group-hover:text-foreground'
                      aria-hidden
                    >
                      <svg
                        width='22'
                        height='10'
                        viewBox='0 0 22 10'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path d='M1 5h19M16 1l4 4-4 4' stroke='currentColor' strokeWidth='1.2' strokeLinecap='round' strokeLinejoin='round' />
                      </svg>
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>

            {/* Footer caption */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, ease, delay: 1.05 }}
              className='border-t border-border/50 px-6 py-4'
            >
              <p
                className='text-[11px] leading-relaxed text-muted-foreground'
                style={{ fontFamily: SUPREME, fontWeight: 300 }}
              >
                Your sessions and preferences sync across devices. No password to remember.
              </p>
            </motion.div>
          </motion.div>
        </aside>
      </main>

      {/* Footer */}
      <footer className='relative z-[3] flex items-end justify-between px-8 pb-8 md:px-16 md:pb-10'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease, delay: 1.2 }}
          className='text-[11px] uppercase tracking-[0.32em] text-muted-foreground'
          style={{ fontFamily: SUPREME, fontWeight: 500 }}
        >
          New session — Pomodoro 25 ⁄ 5
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease, delay: 1.25 }}
          className='hidden text-[11px] uppercase tracking-[0.32em] text-muted-foreground md:block'
          style={{ fontFamily: SUPREME, fontWeight: 500 }}
        >
          ↳ Sign in to begin
        </motion.div>
      </footer>
    </div>
  )
}
