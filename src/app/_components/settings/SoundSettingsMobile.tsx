"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";
import AddSoundButton from "../sounds/AddSoundButton";
import AlarmSoundsButton from "../sounds/AlarmSoundsButton";
import AmbientSoundsButton from "../sounds/AmbientSoundsButton";
import BgMusicSoundsButton from "../sounds/BgMusicSoundsButton";
import ToggleAddMode from "../sounds/ToggleAddMode";
import ToggleDeleteModeButton from "../sounds/ToggleDeleteMode";

export default function SoundSettingsMobile() {
  const [isSoundOpen, setIsSoundOpen] = useState<boolean>(false);
  const { setSoundSettingsOpen } = useSoundsStore();

  useEffect(() => {
    setSoundSettingsOpen(isSoundOpen);
  }, [isSoundOpen, setSoundSettingsOpen]);

  return (
    <main>
      <Drawer>
        <DrawerTrigger>
          <Volume2 onClick={() => setIsSoundOpen(!isSoundOpen)} />
        </DrawerTrigger>
        <DrawerContent className="max-h-screen px-2">
          <DrawerHeader>
            <DrawerTitle className="mx-1">
              <Volume2 />
              <div className="mb-2 mt-4 text-left text-lg font-bold">
                befocus/sounds
              </div>
              <Separator className="mt-4 bg-white" />
            </DrawerTitle>
            {/* <DrawerDescription>This action cannot be undone.</DrawerDescription> */}
          </DrawerHeader>

          <div className="overflow-y-auto px-5 pb-12">
            <AlarmSoundsButton />
            <AmbientSoundsButton />
            <BgMusicSoundsButton />
          </div>

          <DrawerFooter>
            <AddSoundButton />
            <div className="mt-4 flex w-full items-center justify-center space-x-2">
              <ToggleAddMode />
              <ToggleDeleteModeButton />
            </div>
            {/* <DrawerClose>
              <Button variant="outline">Cancel</Button>
            </DrawerClose> */}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
