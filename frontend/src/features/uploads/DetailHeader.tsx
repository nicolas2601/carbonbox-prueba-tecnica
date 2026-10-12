import type { Upload } from "@/lib/api/models";
import { dateFormatter } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTransition } from "./StatusTransition";
import { FileSpreadsheet } from "lucide-react";

export function DetailHeader({ upload }: { upload: Upload }) {
  return <header className="detail-header space-y-4">
    <FileSpreadsheet className="detail-file-symbol" aria-hidden="true" size={32} strokeWidth={1.5} />
    <h1 className="page-title font-display break-all">{upload.fileName}</h1>
    <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
      <StatusTransition upload={upload} inline render={value => <StatusBadge status={value.status} />} />
      <time dateTime={upload.createdAt}>{dateFormatter.format(new Date(upload.createdAt))}</time>
    </div>
    <p className="break-all font-mono text-xs text-ink-muted">{upload.id}</p>
  </header>;
}
