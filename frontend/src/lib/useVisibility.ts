"use client";

import { useEffect, useRef, useState } from "react";

export function useVisibility<T extends Element>(enabled: boolean) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!enabled || !ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => { setVisible(entries[0]?.isIntersecting ?? false); });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled]);
  return { ref, visible };
}
