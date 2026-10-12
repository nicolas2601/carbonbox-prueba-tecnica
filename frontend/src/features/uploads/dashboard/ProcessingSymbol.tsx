"use client";

import { Clock3, ScanLine } from "lucide-react";
import { useVisibility } from "@/lib/useVisibility";

export function ProcessingSymbol({ processing }: { processing: boolean }) {
  const { ref, visible } = useVisibility<HTMLDivElement>(processing);
  const Icon = processing ? ScanLine : Clock3;
  return <div ref={ref} aria-hidden="true" className="processing-symbol" data-active={processing && visible}>
    <span className="processing-halo" /><Icon size={28} strokeWidth={1.5} />
  </div>;
}
