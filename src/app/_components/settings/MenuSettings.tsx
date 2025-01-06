// import { Cog, NotebookPen, Volume2 } from "lucide-react";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "~/components/ui/popover";

// // import {
// //   NavigationMenu,
// //   NavigationMenuContent,
// //   NavigationMenuItem,
// //   NavigationMenuList,
// //   NavigationMenuTrigger,
// // } from "~/components/ui/navigation-menu";
// import { Button } from "~/components/ui/button";
// import { Separator } from "~/components/ui/separator";
// import { SessionSettings } from "./SessionSettings";
// import SoundSettings from "./SoundSettings";

// export default function MenuSettings() {
//   return (
//     <div className="flex items-center justify-center space-x-1">
//       {/* <NavigationMenu>
//         <NavigationMenuList>
//           <NavigationMenuItem>
//             <NavigationMenuTrigger>
//               <NotebookPen />
//             </NavigationMenuTrigger>
//             <NavigationMenuContent>
//               <div className="w-[400px] gap-3 md:w-[500px] lg:w-[400px]">
//                 <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
//                   <NotebookPen />
//                   <div className="mb-2 mt-4 text-lg font-medium">
//                     befocus/todolist
//                   </div>
//                   <Separator className="my-4 bg-white" />
//                   <p className="text-sm leading-tight text-muted-foreground">
//                     &quot;FEATURE COMING SOON&quot;
//                   </p>
//                 </div>
//               </div>
//             </NavigationMenuContent>
//           </NavigationMenuItem>
//           <NavigationMenuItem>
//             <NavigationMenuTrigger>
//               <Volume2 />
//             </NavigationMenuTrigger>
//             <NavigationMenuContent>
//               <SoundSettings />
//             </NavigationMenuContent>
//           </NavigationMenuItem>
//           <NavigationMenuItem>
//             <NavigationMenuTrigger>
//               <Cog />
//             </NavigationMenuTrigger>
//             <NavigationMenuContent>
//               <div className="w-[400px] gap-3 md:w-[500px] lg:w-[400px]">
//                 <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
//                   <Cog />
//                   <div className="mb-2 mt-4 text-lg font-medium">
//                     befocus/sessions-settings
//                   </div>
//                   <Separator className="my-4 bg-white" />
//                   <SessionSettings />
//                 </div>
//               </div>
//             </NavigationMenuContent>
//           </NavigationMenuItem>
//         </NavigationMenuList>
//       </NavigationMenu> */}

//       <Popover>
//         <PopoverTrigger asChild>
//           <Button variant="outline" className="h-12 w-32">
//             <NotebookPen />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-[400px] gap-3 md:w-[500px] lg:w-[400px]">
//           <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
//             <NotebookPen />
//             <div className="mb-2 mt-4 text-lg font-medium">
//               befocus/todolist
//             </div>
//             <Separator className="my-4 bg-white" />
//             <p className="text-sm leading-tight text-muted-foreground">
//               &quot;FEATURE COMING SOON&quot;
//             </p>
//           </div>
//         </PopoverContent>
//       </Popover>
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button variant="outline" className="h-12 w-32">
//             <Volume2 />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-[400px] gap-3 md:w-[500px] lg:w-[400px]">
//           <SoundSettings />
//         </PopoverContent>
//       </Popover>
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button variant="outline" className="h-12 w-32">
//             <Cog />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-[400px] gap-3 md:w-[500px] lg:w-[400px]">
//           <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
//             <Cog />
//             <div className="mb-2 mt-4 text-lg font-medium">
//               befocus/sessions-settings
//             </div>
//             <Separator className="my-4 bg-white" />
//             <SessionSettings />
//           </div>
//         </PopoverContent>
//       </Popover>
//     </div>
//   );
// }

import { Cog, NotebookPen, Volume2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
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
        <PopoverContent className="w-[400px] h-full gap-3 md:w-[500px] lg:w-[400px] bg-gradient-to-b from-muted/50 to-muted p-6 rounded-md">
          <div className="flex flex-col justify-end w-full h-full select-none">
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
        <PopoverContent className="w-[400px] h-full gap-3 md:w-[500px] lg:w-[400px] bg-gradient-to-b from-muted/50 to-muted p-6 rounded-md">
          <SoundSettings />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-12 w-32">
            <Cog />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] h-full gap-3 md:w-[500px] lg:w-[400px] bg-gradient-to-b from-muted/50 to-muted p-6 rounded-md">
          <div className="flex flex-col justify-end w-full h-full select-none">
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
