import type { Page, ResultRow } from "@/lib/api/models";
import { Table, TableBody, TableCaption, TableHeader } from "@/components/ui/table";

const amounts = new Intl.NumberFormat("en-US", { maximumFractionDigits: 20 });

export function ResultTable({ result }: { result: Page<ResultRow> }) {
  return <div className="table-scroll" role="region" aria-label="Processed rows table" tabIndex={0}>
    <Table className="results-table w-full min-w-[520px] text-left text-sm">
      <TableCaption className="sr-only">Processed rows</TableCaption>
      <TableHeader><tr><th scope="col">Category</th><th scope="col" className="text-right">Amount</th><th scope="col">Unit</th><th scope="col">Date</th></tr></TableHeader>
      <TableBody>{result.data.map((row, index) => <tr key={`${result.page}-${index}`}>
        <td className="max-w-xs break-words">{row.category}</td>
        <td className="text-right font-mono tabular-nums">{amounts.format(row.amount)}</td>
        <td className="font-mono">{row.unit}</td><td className="whitespace-nowrap font-mono">{row.date}</td>
      </tr>)}</TableBody>
    </Table>
  </div>;
}
