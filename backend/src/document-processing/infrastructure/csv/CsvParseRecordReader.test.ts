import { expect, it } from "vitest";
import { CsvParseRecordReader } from "./CsvParseRecordReader";
import type { CsvRecord } from "../../application/ports/ICsvRecordReader";

async function* bytes(text: string): AsyncIterable<Uint8Array> {
  const data = new TextEncoder().encode(text);
  for (let index = 0; index < data.length; index += 7) yield data.slice(index, index + 7);
}
async function collect(text: string, reader = new CsvParseRecordReader()): Promise<CsvRecord[]> {
  const records: CsvRecord[] = [];
  for await (const record of reader.read(bytes(text))) records.push(record);
  return records;
}
it("Plain file has header and records on physical lines", async () => {
  const records = await collect("category,amount,unit,date\nWater,10,m3,2024-01-15\nWaste,20,kg,2024-01-16\n");
  expect(records).toEqual([
    { line: 1, fields: ["category", "amount", "unit", "date"] },
    { line: 2, fields: ["Water", "10", "m3", "2024-01-15"] },
    { line: 3, fields: ["Waste", "20", "kg", "2024-01-16"] },
  ]);
});
