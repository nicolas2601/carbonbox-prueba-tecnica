import Link from "next/link";
import { ArrowUpRight, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { dateFormatter, numberFormatter } from "@/lib/format";
import { useUploads } from "../hooks";
import { ACTIVITY_LIMIT } from "./chartModels";

export function LatestUpload() {
  const query = useUploads(1, ACTIVITY_LIMIT);
  const latest = query.data?.data[0];
  return <Card className="latest-card enter"><header className="bento-heading"><h2>Latest upload</h2><FileSpreadsheet aria-hidden="true" size={20} /></header>
    {latest ? <><Link className="latest-file font-mono" href={`/uploads/${encodeURIComponent(latest.id)}`} prefetch={false}>{latest.fileName}<ArrowUpRight aria-hidden="true" size={18} /></Link>
      <div className="latest-meta"><StatusBadge status={latest.status} /><time dateTime={latest.createdAt}>{dateFormatter.format(new Date(latest.createdAt))}</time></div>
      <ol className="file-timeline" aria-label="Latest upload timeline"><li>Received</li><li data-active={latest.status !== "PENDING"}>Processing</li><li data-active={latest.status === "COMPLETED" || latest.status === "FAILED"}>{latest.status === "FAILED" ? "Failed" : "Complete"}</li></ol>
      <p className="latest-caption">{numberFormatter.format((latest.processedRows ?? 0) + (latest.failedRows ?? 0))} rows handled</p></>
      : <p className="latest-caption">{query.isPending ? "Loading latest upload" : query.isError ? "Latest upload unavailable" : "Your next upload starts here."}</p>}
  </Card>;
}
