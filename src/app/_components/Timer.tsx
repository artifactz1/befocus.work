"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
// import { Icons } from "@/compon../../lib/utilsents/icons"

import {
  Cog,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { DarkModeToggle } from "./DarkModeToggle";
import { Settings } from "./sessionSettings";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
];

export default function Timer() {
  const [sessions, setSessions] = useState(6);
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [currentSession, setCurrentSession] = useState(1);
  const [isWorking, setIsWorking] = useState(true);
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);

  const reset = useCallback(() => {
    setCurrentSession(1);
    setIsWorking(true);
    setTimeLeft(workDuration);
    setIsRunning(false);
  }, [workDuration]);

  const skipToNextSession = () => {
    if (isWorking) {
      setIsWorking(false);
      setTimeLeft(breakDuration);
    } else {
      setIsWorking(true);
      setTimeLeft(workDuration);
      setCurrentSession((prev) => Math.min(prev + 1, sessions)); // Increment session if moving to work
    }

    setIsRunning(false);
  };

  useEffect(() => {
    reset();
  }, [workDuration, breakDuration, sessions, reset]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === 0) {
            if (isWorking && currentSession < sessions) {
              setIsWorking(false);
              return breakDuration;
            } else if (!isWorking) {
              setIsWorking(true);
              setCurrentSession((prev) => prev + 1);
              return workDuration;
            } else {
              setIsRunning(false);
              return 0;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    isWorking,
    currentSession,
    sessions,
    workDuration,
    breakDuration,
  ]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const handleSettingsChange = (key: string, value: number) => {
    switch (key) {
      case "sessions":
        setSessions(value);
        break;
      case "workDuration":
        setWorkDuration(value * 60);
        break;
      case "breakDuration":
        setBreakDuration(value * 60);
        break;
    }
  };

  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <div className="flex w-full items-center justify-between">
        {/* Focus/Break */}
        <div className="font-regular text-9xl">
          {isWorking ? "Focus" : "Break"}
        </div>
        <div className="flex flex-col items-center justify-center text-right">
          <p className="text-xl font-medium">Session</p>
          <p className="text-4xl font-light">
            {currentSession} / {sessions}
          </p>
        </div>
      </div>

      {/* Time Left */}
      <div className="-my-20 text-[36rem] font-bold">
        {formatTime(timeLeft)}
      </div>

      {/* Buttons */}
      <div className="-mt-20 flex items-center justify-center space-x-4 opacity-0 transition-opacity duration-500 hover:opacity-100">
        <Button
          onClick={toggleTimer}
          variant="outline"
          size="lg"
          className="h-12 w-32"
        >
          {isRunning ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          size="lg"
          className="h-12 w-32"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
        <Button
          onClick={skipToNextSession}
          variant="outline"
          size="lg"
          className="h-12 w-32"
        >
          <SkipForward className="h-6 w-6" />
        </Button>
        <DarkModeToggle />
      </div>

      {/* <div className="flex flex-col justify-between">
        <div>
          <h2 className="mb-4 text-2xl font-medium">Settings</h2>
          <Settings
            sessions={sessions}
            workDuration={workDuration / 60}
            breakDuration={breakDuration / 60}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div> */}
      <div className="mr-10 flex w-full items-center justify-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <NotebookPen />
              </NavigationMenuTrigger>
              <NavigationMenuContent></NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <Volume2 />
              </NavigationMenuTrigger>
              <NavigationMenuContent></NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <Cog></Cog>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px]">
                  <div className="rounded-md bg-card p-6 shadow-md">
                    <h2 className="mb-4 text-2xl font-medium">Settings</h2>
                    <Settings
                      sessions={sessions}
                      workDuration={workDuration / 60}
                      breakDuration={breakDuration / 60}
                      onSettingsChange={handleSettingsChange}
                    />
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
