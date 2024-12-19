"use client";

import { useEffect, useState } from "react";

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
    <button onClick={handleToggle} className="h-6 w-6 rounded-full">
      {isDarkMode ? "🌙" : "☀️"} {/* This changes the icon */}
    </button>
  );
};
