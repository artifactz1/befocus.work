import { Cog, NotebookPen, Volume2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { SessionSettings } from "./SessionSettings";
import SoundSettings from "./SoundSettings";

export default function MenuSettings() {
  return (
    <div className="flex items-center justify-center space-x-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-12 w-32">
            <NotebookPen />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="h-full w-[400px] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 md:w-[500px] lg:w-[392px]"
        >
          <div className="flex h-full w-full select-none flex-col justify-end">
            <NotebookPen />
            <div className="mb-2 mt-4 text-lg font-medium">
              befocus/todolist
            </div>
            <Separator className="my-4 bg-white" />
            <p className="text-sm leading-tight text-muted-foreground">
              &quot;FEATURE COMING SOON&quot;
            </p>
          </div>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-12 w-32">
            <Volume2 />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="h-full w-[400px] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 md:w-[500px] lg:w-[392px]">
          <SoundSettings />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-12 w-32">
            <Cog />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="h-full w-[400px] gap-3 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 md:w-[500px] lg:w-[392px]"
        >
          <div className="flex h-full w-full select-none flex-col justify-end">
            <Cog />
            <div className="mb-2 mt-4 text-lg font-medium">
              befocus/sessions-settings
            </div>
            <Separator className="my-4 bg-white" />
            <SessionSettings />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
