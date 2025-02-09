import MenuSettings from "./settings/MenuSettings";
import TimerButtons from "./timer/TimerButtons";

export default function Footer() {
  return (
    <div className="z-10 flex h-[15vh] w-full flex-col justify-between px-[5vw] md:flex-row">
      <MenuSettings />
      <TimerButtons />
    </div>
  );
}
