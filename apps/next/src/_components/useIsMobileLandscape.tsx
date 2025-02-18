import { useEffect, useState } from "react";

export default function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth > window.innerHeight && window.innerWidth <= 1024
      : false,
  );

  useEffect(() => {
    const updateOrientation = () => {
      requestAnimationFrame(() => {
        setIsLandscape(
          // window.innerWidth > window.innerHeight && window.innerWidth <= 1024
          window.innerWidth > window.innerHeight && window.innerWidth <= 1024 && window.innerHeight <= 640,
        );
      });
    };

    updateOrientation(); // Set initial state
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []); // Don't include isLandscape

  return isLandscape;
}