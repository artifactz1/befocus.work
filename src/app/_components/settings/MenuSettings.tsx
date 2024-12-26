"use client";
import { Cog, NotebookPen, Volume2 } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";
import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";
import AddSoundButton from "../sounds/AddSoundButton";
import SoundSettings from "../sounds/SoundButton";
import ToggleAddMode from "../sounds/ToggleAddMode";
import ToggleDeleteModeButton from "../sounds/ToggleDeleteMode";
import { SessionSettings } from "./SessionSettings";

export default function MenuSettings() {
  const { sounds } = useSoundsStore();

  if (Object.keys(sounds).length === 0) {
    useSoundsStore
      .getState()
      .addSound(
        "rain",
        "https://www.youtube.com/watch?v=yIQd2Ya0Ziw&ab_channel=Calm",
      );
    // useSoundsStore.getState().addSound('sound2', 'https://www.youtube.com/watch?v=VPFxZw5qUwE&ab_channel=CafeRelaxingMusic');
    useSoundsStore
      .getState()
      .addSound(
        "jazz",
        "https://www.youtube.com/watch?v=VwR3LBbL6Jk&ab_channel=SolaceCrossing",
      );
  }

  return (
    <div className="flex items-center justify-center">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <NotebookPen />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px] gap-3 md:w-[500px] lg:w-[400px]">
                <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                  <NotebookPen />
                  <div className="mb-2 mt-4 text-lg font-medium">
                    befocus/todolist
                  </div>
                  <Separator className="my-4 bg-white" />
                  <p className="text-sm leading-tight text-muted-foreground">
                    &quot;FEATURE COMING SOON&quot;
                  </p>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <Volume2 />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px] gap-3 md:w-[500px] lg:w-[400px]">
                <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                  <Volume2 />
                  <div className="mb-2 mt-4 text-lg font-medium">
                    befocus/sounds
                  </div>
                  <Separator className="my-4 bg-white" />
                  {}
                  <div className="space-y-4">
                    {Object.keys(sounds).map((soundId) => (
                      <SoundSettings key={soundId} soundId={soundId} />
                    ))}
                  </div>

                  <AddSoundButton />
                  <div className="mt-4 flex w-full items-center justify-center space-x-5 px-4 py-2">
                    <ToggleAddMode />
                    {/* <div>:</div> */}
                    <ToggleDeleteModeButton />
                  </div>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <Cog />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px] gap-3 md:w-[500px] lg:w-[400px]">
                <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                  <Cog />
                  <div className="mb-2 mt-4 text-lg font-medium">
                    befocus/sessions-settings
                  </div>
                  <Separator className="my-4 bg-white" />
                  <SessionSettings />
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
