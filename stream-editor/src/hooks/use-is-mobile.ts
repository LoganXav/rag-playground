"use client";
import React from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile on mount + on resize
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return { isMobile };
}
