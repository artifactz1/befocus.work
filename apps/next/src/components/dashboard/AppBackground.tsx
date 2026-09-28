export default function AppBackground() {
  return (
    <>
      {/* Solid theme background */}
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 z-0'
        style={{ backgroundColor: 'var(--bg-solid)' }}
      />

      {/* User-customizable image (settings page will populate via CSS vars) */}
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 z-0'
        style={{
          backgroundImage: 'var(--bg-image)',
          backgroundSize: 'var(--bg-image-size)',
          backgroundPosition: 'var(--bg-image-position)',
          filter: 'blur(var(--bg-blur))',
        }}
      />

      {/* User-customizable overlay tint */}
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 z-0'
        style={{
          backgroundColor: 'var(--bg-overlay-color)',
          opacity: 'var(--bg-overlay-opacity)',
        }}
      />

      {/* Grain */}
      <svg
        aria-hidden
        className='pointer-events-none fixed inset-0 z-0 h-full w-full mix-blend-overlay'
        style={{ opacity: 'var(--grain-opacity)' }}
      >
        <filter id='app-grain'>
          <feTurbulence
            type='fractalNoise'
            baseFrequency='0.9'
            numOctaves='2'
            stitchTiles='stitch'
          />
          <feColorMatrix type='saturate' values='0' />
        </filter>
        <rect width='100%' height='100%' filter='url(#app-grain)' />
      </svg>
    </>
  )
}
