import { useEffect, useState } from "react";

export default function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight && window.innerWidth <= 1024,
  );

  useEffect(() => {
    const updateOrientation = () => {
      requestAnimationFrame(() => {
        setIsLandscape(
          window.innerWidth > window.innerHeight && window.innerWidth <= 1024,
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
