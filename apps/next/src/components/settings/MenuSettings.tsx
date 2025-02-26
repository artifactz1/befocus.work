"use client";
import { DarkModeToggle } from "../DarkModeToggle";
import ToDoList from "../to-do-list/ToDoList";
import { SessionSettings } from './SessionSettings';
import SoundSettings from "./SoundSettings";

export default function MenuSettings() {
  return (
    <main className="hidden sm:flex sm:items-center sm:justify-center sm:space-x-1">
      <ToDoList />
      <SoundSettings />
      <SessionSettings />
      <DarkModeToggle />
    </main>
  );
}
