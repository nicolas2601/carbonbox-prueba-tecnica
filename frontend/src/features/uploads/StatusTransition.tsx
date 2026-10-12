"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Upload } from "@/lib/api/models";

const CROSSFADE_MS = 200;
interface Frame { current: Upload; previous: Upload | null; }

export function StatusTransition({ upload, render, inline = false }: { upload: Upload; render(value: Upload): ReactNode; inline?: boolean }) {
  const [frame, setFrame] = useState<Frame>({ current: upload, previous: null });
  if (frame.current !== upload) {
    setFrame({ current: upload, previous: frame.current.status === upload.status ? frame.previous : frame.current });
  }
  useEffect(() => {
    if (!frame.previous) return;
    const timer = setTimeout(() => { setFrame(value => ({ ...value, previous: null })); }, CROSSFADE_MS);
    return () => clearTimeout(timer);
  }, [frame.previous]);
  return <div className="status-transition" data-changing={Boolean(frame.previous)} data-inline={inline}>
    {frame.previous && <div className="status-transition-previous" aria-hidden="true" inert>{render(frame.previous)}</div>}
    <div key={upload.status} className="status-transition-current">{render(upload)}</div>
  </div>;
}
