import MenuSettings from './settings/MenuSettings'
import MenuSettingsMobile from './settings/MenuSettingsMobile'
import TimerButtons from './timer/TimerButtons'

export default function Footer() {
  return (
    // <div className="z-10 mb-10 flex h-[15vh] w-full flex-col-reverse justify-between gap-5 px-[5vw] md:mb-0 md:flex-row md:gap-10">
    <div className='z-10 mb-10 flex h-[15vh] w-full flex-col-reverse justify-between gap-5 px-[5vw] md:mb-0 md:flex-row md:gap-0'>
      <MenuSettingsMobile />
      <TimerButtons />
      <MenuSettings />
    </div>
  )
}
