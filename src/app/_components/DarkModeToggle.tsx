"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

export const DarkModeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage or default to dark mode
    const darkModeFromLocalStorage =
      localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeFromLocalStorage);

    if (darkModeFromLocalStorage) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleToggle = () => {
    setIsDarkMode((prevMode) => !prevMode);

    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    }
  };

  return (
    <Button
      onClick={handleToggle}
      variant="outline"
      size="lg"
      className="h-12 w-32"
    >
      {isDarkMode ? <Sun strokeWidth={3} /> : <Moon strokeWidth={3} />}{" "}
      {/* This changes the icon */}
    </Button>
  );
};
