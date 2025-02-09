import MenuSettings from "./settings/MenuSettings";
import TimerButtons from "./timer/TimerButtons";

export default function Footer() {
  return (
    <div className="z-10 mb-10 flex h-[15vh] w-full flex-col-reverse justify-between gap-10 px-[5vw] sm:mb-0 sm:flex-row sm:gap-10">
      <MenuSettings />
      <TimerButtons />
    </div>
  );
}
