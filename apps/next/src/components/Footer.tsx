import NowPlayingChip from './records/NowPlayingChip'
import MenuSettings from './settings/MenuSettings'
import MenuSettingsMobile from './settings/MenuSettingsMobile'
import TimerButtons from './timer/TimerButtons'

export default function Footer() {
  return (
    <div className='bf-chrome relative z-10 mb-10 flex h-[calc(11vh+var(--pad-y))] w-full flex-col-reverse justify-between gap-5 px-[var(--pad-x)] md:mb-0 md:flex-row md:gap-0'>
      <NowPlayingChip />
      <MenuSettingsMobile />
      <TimerButtons />
      <MenuSettings />
    </div>
  )
}
