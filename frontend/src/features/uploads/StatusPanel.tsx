import type { Upload } from "@/lib/api/models";
import { useEffect, useRef, useState } from "react";
import { ActivePanel } from "./ActivePanel";
import { FinishedPanel } from "./FinishedPanel";
import { FailedPanel } from "./FailedPanel";
import { observeHandledRows, type RowObservation } from "./processingReadout";

export function StatusPanel({ upload, page }: { upload: Upload; page: number }) {
  const [observation, setObservation] = useState<RowObservation | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const previous = useRef<{ id: string; status: Upload["status"]; handled: number; at: number } | null>(null);
  useEffect(() => {
    if (upload.status !== "PROCESSING") { previous.current = null; return; }
    const handled = (upload.processedRows ?? 0) + (upload.failedRows ?? 0);
    const at = Date.now();
    const last = previous.current;
    if (!last || last.id !== upload.id || last.status !== upload.status || handled !== last.handled) {
      const next = observeHandledRows(last, { id: upload.id, handled, at });
      previous.current = { ...next, status: upload.status };
      setObservation(next);
    }
  }, [upload]);
  useEffect(() => {
    if (upload.status !== "PROCESSING") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [upload.status, upload.id]);
  const readout = observation?.id === upload.id && upload.status === "PROCESSING" ? observation.rate : undefined;
  const elapsedSeconds = Math.max(0, Math.floor((now - Date.parse(upload.createdAt)) / 1000));
  return <>
    {upload.status === "COMPLETED" && <FinishedPanel upload={upload} page={page} />}
    {upload.status === "FAILED" && <FailedPanel upload={upload} />}
    {(upload.status === "PENDING" || upload.status === "PROCESSING") && <ActivePanel upload={upload} rowsPerSecond={readout} elapsedSeconds={elapsedSeconds} />}
  </>;
}
