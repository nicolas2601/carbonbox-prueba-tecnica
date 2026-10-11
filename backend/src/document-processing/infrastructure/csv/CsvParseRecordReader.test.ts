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

it("Quoted comma and escaped quote remain in a single field", async () => {
  const records = await collect('category,amount,unit,date\n"Fuel, Diesel",10,L,2024-01-15\n"Travel ""rail""",20,km,2024-01-16\n');
  expect(records[1]).toEqual({ line: 2, fields: ["Fuel, Diesel", "10", "L", "2024-01-15"] });
  expect(records[2]?.fields[0]).toBe('Travel "rail"');
});
it.each(["\n", "\r\n"])("Quoted line break preserves starting and following physical lines: %j", async newline => {
  const records = await collect(`category,amount,unit,date${newline}"Business${newline}Travel",10,km,2024-01-15${newline}Water,20,m3,2024-01-16${newline}`);
  expect(records.map(record => record.line)).toEqual([1, 2, 4]);
  expect(records[1]?.fields[0]).toBe(`Business${newline}Travel`);
});
it("An empty physical line inside quotes is not skipped", async () => {
  const records = await collect('category,amount,unit,date\n"Business\n\nTravel",10,km,2024-01-15\nWater,20,m3,2024-01-16');
  expect(records.map(record => record.line)).toEqual([1, 2, 5]);
});
