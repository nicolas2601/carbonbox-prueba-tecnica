import type { Upload } from "@/lib/api/models";
import { ActivePanel } from "./ActivePanel";
import { FinishedPanel } from "./FinishedPanel";
import { FailedPanel } from "./FailedPanel";

export function StatusPanel({ upload, page }: { upload: Upload; page: number }) {
  if (upload.status === "COMPLETED") return <FinishedPanel upload={upload} page={page} />;
  if (upload.status === "FAILED") return <FailedPanel upload={upload} />;
  return <ActivePanel upload={upload} />;
}
