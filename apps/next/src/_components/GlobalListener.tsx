"use client";

import { useEffect } from "react";
import { useDeviceStore } from "~/store/useDeviceStore";

export default function GlobalListener() {
  const { checkOrientation } = useDeviceStore();

  useEffect(() => {
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, [checkOrientation]);

  return null; // No UI, just an effect
}
