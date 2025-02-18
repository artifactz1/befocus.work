"use client";

import { DarkModeToggle } from '../DarkModeToggle';

export default function MenuSettingsMobile() {
  return (
    <main className="flex h-fit flex-row items-center justify-center sm:hidden gap-1">
      <ToDoListMobile />
      <SoundSettingsMobile />
      <SessionSettingsMobile />
      <DarkModeToggle />
    </main>
  );
}