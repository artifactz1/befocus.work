import { useEffect, useState } from "react";

export default function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(
        window.innerWidth > window.innerHeight && window.innerHeight < 1024,
      );
    };

    updateOrientation(); // Set initial state
    window.addEventListener("resize", updateOrientation);

    return () => window.removeEventListener("resize", updateOrientation);
  }, []);

  return isLandscape;
}
