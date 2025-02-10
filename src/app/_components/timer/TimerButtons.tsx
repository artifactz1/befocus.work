// "use client";

// import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
// import { Button } from "~/components/ui/button";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "~/components/ui/tooltip";
// import { useTimerStore } from "~/store/useTimerStore";

// export default function TimerButtons() {
//   const { isRunning, resetCurrentTime, skipToNextSession, toggleTimer } =
//     useTimerStore();

//   return (
//     <div className="flex items-center justify-center space-x-1">
//       <TooltipProvider>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               onClick={toggleTimer}
//               variant="outline"
//               size="lg"
//               className="h-12 w-32"
//             >
//               {isRunning ? (
//                 <Pause className="h-6 w-6" strokeWidth={3} />
//               ) : (
//                 <Play className="h-6 w-6" strokeWidth={3} />
//               )}
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent className="font-bold">
//             {isRunning ? "Pause" : "Play"}
//           </TooltipContent>
//         </Tooltip>
//       </TooltipProvider>
//       <TooltipProvider>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               onClick={() => resetCurrentTime()}
//               variant="outline"
//               size="lg"
//               className="h-12 w-32"
//             >
//               <RotateCcw className="h-6 w-6" strokeWidth={3} />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>
//             <TooltipContent className="font-bold"> Reset Time</TooltipContent>
//           </TooltipContent>
//         </Tooltip>
//       </TooltipProvider>

//       <TooltipProvider>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               onClick={skipToNextSession}
//               variant="outline"
//               size="lg"
//               className="h-12 w-32"
//             >
//               <SkipForward className="h-6 w-6" strokeWidth={3} />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent className="font-bold">Skip To Next</TooltipContent>
//         </Tooltip>
//       </TooltipProvider>
//     </div>
//   );
// }

"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useTimerStore } from "~/store/useTimerStore";

export default function TimerButtons() {
  const { isRunning, resetCurrentTime, skipToNextSession, toggleTimer } =
    useTimerStore();

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // 'sm' breakpoint is 640px
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const buttonVariant = isSmallScreen ? "ghost" : "outline";

  const [buttonSize, setButtonSize] = useState<
    "lg" | "sm" | "default" | "icon"
  >("lg");

  useEffect(() => {
    const handleResize = () => {
      setButtonSize(window.innerWidth < 640 ? "lg" : "lg");
    };

    handleResize(); // Set initial size
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex items-center justify-center space-x-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleTimer}
              variant={buttonVariant}
              // size={window.length < 640 ? "sm" : "lg"}
              size={buttonSize}
              className="lg:h-12 lg:w-32"
            >
              {isRunning ? (
                <Pause className="h-6 w-6" strokeWidth={3} />
              ) : (
                <Play className="h-6 w-6" strokeWidth={3} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="font-bold">
            {isRunning ? "Pause" : "Play"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={resetCurrentTime}
              variant={buttonVariant}
              size={buttonSize}
              className="lg:h-12 lg:w-32"
            >
              <RotateCcw className="h-6 w-6" strokeWidth={3} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="font-bold">Reset Time</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={skipToNextSession}
              variant={buttonVariant}
              // size={window.length < 640 ? "sm" : "lg"}
              size={buttonSize}
              className="lg:h-12 lg:w-32"
            >
              <SkipForward className="h-6 w-6" strokeWidth={3} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="font-bold">Skip To Next</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
