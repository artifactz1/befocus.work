import MenuSettings from "./settings/MenuSettings";
import TimerButtons from "./timer/TimerButtons";

export default function Footer() {
  return (
    <div className="z-10 flex h-[15vh] w-full flex-row justify-between px-[5vw]">
      <MenuSettings />
      <TimerButtons />
    </div>
  );
}
