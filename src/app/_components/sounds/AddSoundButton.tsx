"use client";

import { useState } from "react";

import { Toggle } from "@radix-ui/react-toggle";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

import { useSoundsStore } from "~/store/useSoundStore";

export default function AddSoundButton() {
  const { addSound } = useSoundsStore();

  const [name, setName] = useState("");
  const [link, setLink] = useState("");

  const handleSubmit = () => {
    addSound(name, link)
    setName("")
    setLink("")
  } 


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Toggle className="w-fit">
          <Plus />
        </Toggle>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Your Own Sounds! </DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when youapos&;re done.
            Add your own ambient or musical sounds here! Highliy recommend using
            youtube links for now.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Sound name
            </Label>
            <Input
              id="name"
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Link
            </Label>
            <Input
              id="username"
              onChange={(e) => setLink(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
