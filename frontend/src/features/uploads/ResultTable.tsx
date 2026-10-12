import type { Page, ResultRow } from "@/lib/api/models";

const amounts = new Intl.NumberFormat("en-US", { maximumFractionDigits: 20 });

export function ResultTable({ result }: { result: Page<ResultRow> }) {
  return <div className="table-scroll" role="region" aria-label="Processed rows table" tabIndex={0}>
    <table className="results-table w-full min-w-[520px] text-left text-sm">
      <caption className="sr-only">Processed rows</caption>
      <thead><tr><th scope="col">Category</th><th scope="col" className="text-right">Amount</th><th scope="col">Unit</th><th scope="col">Date</th></tr></thead>
      <tbody>{result.data.map((row, index) => <tr key={`${result.page}-${index}`}>
        <td className="max-w-xs break-words">{row.category}</td>
        <td className="text-right font-mono tabular-nums">{amounts.format(row.amount)}</td>
        <td className="font-mono">{row.unit}</td><td className="whitespace-nowrap font-mono">{row.date}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
