import MenuSettings from "./settings/MenuSettings";
import TimerButtons from "./timer/TimerButtons";

export default function Footer() {
  return (
    <div className="flex h-[10vh] flex-row justify-between">
      <MenuSettings />
      <TimerButtons />
    </div>
  );
}
