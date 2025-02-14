"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Separator } from "~/components/ui/separator";
import { useSoundsStore } from "~/store/useSoundsStore";
import SoundButton from "./SoundButton";

export default function AmbientSoundsButton() {
  const { sounds } = useSoundsStore();

  return (
    <main>
      <Separator className="my-4 bg-white" />
      <Accordion type="single" collapsible>
        <AccordionItem className="border-0" value="item-1">
          <AccordionTrigger className="text-md font-bold">
            Ambient Sounds
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {Object.keys(sounds)
                .filter((soundId) => sounds[soundId]?.soundType === "ambient")
                .map((soundId) => (
                  <SoundButton key={soundId} soundId={soundId} />
                ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* <h3 className="text-left font-semibold mb-3"> Ambient Sounds</h3> */}
      {/* <div className="space-y-4">
        {Object.keys(sounds)
          .filter((soundId) => sounds[soundId]?.soundType === "ambient")
          .map((soundId) => (
            <SoundButton key={soundId} soundId={soundId} />
          ))}
      </div> */}
    </main>
  );
}
