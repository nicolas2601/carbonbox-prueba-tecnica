import Link from "next/link";
import type { CSSProperties } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { Upload } from "@/lib/api/models";

const dates = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function UploadsTable({ uploads, caption }: { uploads: Upload[]; caption: string }) {
  return <div className="table-scroll" role="region" aria-label={`${caption} table`} tabIndex={0}>
    <table className="uploads-table">
      <caption className="sr-only">{caption}</caption>
      <thead><tr>{["File name", "Status", "Upload date"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{uploads.map((item, index) => <tr key={item.id} className="data-row enter" style={{ "--order": index } as CSSProperties}>
        <td><Link className="file-link font-mono" href={`/uploads/${encodeURIComponent(item.id)}`} title={item.fileName}>{item.fileName}</Link></td>
        <td><StatusBadge status={item.status} /></td>
        <td><time dateTime={item.createdAt}>{dates.format(new Date(item.createdAt))}</time></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
