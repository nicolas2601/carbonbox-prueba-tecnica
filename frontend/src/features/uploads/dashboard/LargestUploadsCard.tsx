"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { Upload } from "@/lib/api/models";
import type { ApiError } from "@/lib/api/ApiError";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { numberFormatter } from "@/lib/format";
import { largestUploads } from "./insightModels";
import { LargestUploadsChart } from "./LazyCharts";

export function LargestUploadsCard({ uploads = [], loading = false, error, onRetry }: {
  uploads?: readonly Upload[]; loading?: boolean; error?: ApiError | null; onRetry?: () => void;
}) {
  const points = largestUploads(uploads);
  return <Card className="largest-uploads-card">
    <header className="bento-heading"><div><h2>Largest recent uploads</h2><p>Rows handled in the last 12 files</p></div></header>
    {loading ? <div role="status" aria-label="Loading largest uploads"><Skeleton className="largest-skeleton" /></div>
      : error ? onRetry ? <ErrorState error={error} onRetry={onRetry} /> : <p role="alert">Recent files unavailable. Reload to retry.</p>
      : points.length === 0 ? <p className="insight-empty">No handled rows yet</p>
      : <div className="largest-layout" style={{ "--file-count": points.length } as CSSProperties}>
        <ul aria-label="Largest recent uploads">{points.map(point => <li key={point.id}>
          <Link href={`/uploads/${encodeURIComponent(point.id)}`} title={point.fileName}>{point.fileName}</Link>
          <span>{numberFormatter.format(point.rows)}</span>
        </li>)}</ul><div className="largest-chart" aria-hidden="true"><LargestUploadsChart points={points} /></div>
      </div>}
  </Card>;
}
