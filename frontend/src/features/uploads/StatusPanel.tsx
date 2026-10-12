import type { Upload } from "@/lib/api/models";
import { ActivePanel } from "./ActivePanel";
import { FinishedPanel } from "./FinishedPanel";

export function StatusPanel({ upload, page }: { upload: Upload; page: number }) {
  if (upload.status === "COMPLETED") return <FinishedPanel upload={upload} page={page} />;
  return <ActivePanel upload={upload} />;
}
