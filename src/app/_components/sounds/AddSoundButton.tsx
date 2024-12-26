"use client";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useSoundsStore } from "~/store/useSoundsStore";

export default function AddSoundButton() {
  const { addSound, isAddMode, toggleAddMode } = useSoundsStore();
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [toggled, setToggled] = useState(false);

  const validateYoutubeLink = (url: string) => {
    // Regular expression to match YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value;
    setLink(newLink);

    if (newLink && !validateYoutubeLink(newLink)) {
      setLinkError("Please enter a valid YouTube link");
    } else {
      setLinkError("");
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setLinkError("Please enter a sound name");
      return;
    }

    if (!validateYoutubeLink(link)) {
      setLinkError("Please enter a valid YouTube link");
      return;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks

    addSound(name, link);

    setName("");
    setLink("");
    setLinkError("");
    setIsOpen(false);
    toggleAddMode();
  };

  return (
    // <Dialog open={isOpen} onOpenChange={setIsOpen}>
    //   <DialogTrigger asChild>
    //     <Button className="w-fit">
    //       <Plus />
    //     </Button>
    //   </DialogTrigger>
    //   <DialogContent className="sm:max-w-[425px]">
    //     <DialogHeader>
    //       <DialogTitle>Add Your Own Sounds!</DialogTitle>
    //       <DialogDescription>
    //         Add your own ambient or musical sounds here! Please use YouTube
    //         links only.
    //       </DialogDescription>
    //     </DialogHeader>
    //     <div className="grid gap-4 py-4">
    //       <div className="grid grid-cols-4 items-center gap-4">
    //         <Label htmlFor="name" className="text-right">
    //           Sound name
    //         </Label>
    //         <Input
    //           id="name"
    //           value={name}
    //           onChange={(e) => setName(e.target.value)}
    //           className="col-span-3"
    //           placeholder="Enter sound name"
    //         />
    //       </div>
    //       <div className="grid grid-cols-4 items-center gap-4">
    //         <Label htmlFor="youtube-link" className="text-right">
    //           YouTube Link
    //         </Label>
    //         <div className="col-span-3 space-y-2">
    //           <Input
    //             id="youtube-link"
    //             value={link}
    //             onChange={handleLinkChange}
    //             className={linkError ? "border-red-500" : ""}
    //             placeholder="https://youtube.com/..."
    //           />
    //           {linkError && (
    //             <p className="px-1 text-sm text-red-500">{linkError}</p>
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //     <DialogFooter>
    //       <Button
    //         type="submit"
    //         onClick={handleSubmit}
    //         disabled={!name.trim() || !link.trim() || !!linkError}
    //       >
    //         Add
    //       </Button>
    //     </DialogFooter>
    //   </DialogContent>
    // </Dialog>
    <main>
      {isAddMode && (
        <div className="flex flex-col space-y-4 py-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-left">
              Sound name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 border-white"
              placeholder="Enter sound name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube-link" className="text-right">
              YouTube Link
            </Label>
            <Input
              id="youtube-link"
              value={link}
              onChange={handleLinkChange}
              className={linkError ? "border-red-500" : "border-white"}
              placeholder="https://youtube.com/..."
            />
          </div>

          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim() || !link.trim() || !!linkError}
          >
            Add
          </Button>
        </div>
      )}
    </main>
  );
}
