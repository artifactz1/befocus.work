import React from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";

import { Cog, NotebookPen, Volume2 } from "lucide-react"; // Icon library
import { Settings } from "../../_components/Settings";

type SettingsPanelProps = {
  sessions: number;
  workDuration: number; // in seconds
  breakDuration: number; // in seconds
  handleSettingsChange: (newSettings: {
    sessions: number;
    workDuration: number;
    breakDuration: number;
  }) => void;
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  sessions,
  workDuration,
  breakDuration,
  handleSettingsChange,
}) => {
  return (
    <div className="mr-10 flex w-full items-center justify-center">
      <NavigationMenu>
        <NavigationMenuList>
          {/* Notebook Icon */}
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <NotebookPen />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              {/* Add notebook-specific content here */}
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Volume Icon */}
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <Volume2 />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              {/* Add volume-specific content here */}
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Settings Icon */}
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <Cog />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px]">
                <div className="rounded-md bg-card p-6 shadow-md">
                  <h2 className="mb-4 text-2xl font-medium">Settings</h2>
                  <Settings
                    sessions={sessions}
                    workDuration={workDuration / 60} // Convert seconds to minutes
                    breakDuration={breakDuration / 60} // Convert seconds to minutes
                    onSettingsChange={handleSettingsChange}
                  />
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export default SettingsPanel;
