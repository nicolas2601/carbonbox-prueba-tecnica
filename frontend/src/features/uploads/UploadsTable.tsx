import Link from "next/link";
import type { CSSProperties } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { Upload } from "@/lib/api/models";
import { dateFormatter, numberFormatter } from "@/lib/format";

export function UploadsTable({ uploads, caption, detailed = false }: { uploads: Upload[]; caption: string; detailed?: boolean }) {
  const headings = ["File name", "Status", "Upload date", ...(detailed ? ["Processed rows", "Actions"] : [])];
  return <div className="table-scroll" role="region" aria-label={`${caption} table`} tabIndex={0}>
    <table role="table" className="uploads-table" data-detailed={detailed}>
      <caption className="sr-only">{caption}</caption>
      <thead role="rowgroup"><tr role="row">{headings.map(label => <th key={label} role="columnheader" scope="col">{label}</th>)}</tr></thead>
      <tbody role="rowgroup">{uploads.map((item, index) => <tr role="row" key={item.id} className="data-row enter" style={{ "--order": index } as CSSProperties}>
        <td role="cell" data-column="file"><Link className="file-link font-mono" href={`/uploads/${encodeURIComponent(item.id)}`} title={item.fileName} prefetch={false}>{item.fileName}</Link></td>
        <td role="cell" data-column="status"><StatusBadge status={item.status} /></td>
        <td role="cell" data-column="date"><time dateTime={item.createdAt}>{dateFormatter.format(new Date(item.createdAt))}</time></td>
        {detailed && <td role="cell" data-column="processed" className="font-mono tabular-nums">{item.processedRows === null ? "—" : numberFormatter.format(item.processedRows)}</td>}
        {detailed && <td role="cell" data-column="actions"><Link className="table-action" href={`/uploads/${encodeURIComponent(item.id)}`} aria-label={`View ${item.fileName}`} prefetch={false}>View details</Link></td>}
      </tr>)}</tbody>
    </table>
  </div>;
}
