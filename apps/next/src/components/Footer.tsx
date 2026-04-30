import TimerButtons from './timer/TimerButtons'

export default function Footer() {
  return (
    <div className='z-10 mb-10 flex h-[15vh] w-full items-center justify-center px-[5vw] md:mb-0'>
      <TimerButtons />
    </div>
  )
}
