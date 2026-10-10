// Regenerates the sample CSV files. Run it from the repository root:
//   bun scripts/generate-fixtures.ts      or      npx tsx scripts/generate-fixtures.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HEADER = "category,amount,unit,date";
const SEED = 20241012;
const ACTIVITIES = [
  ["Electricity", "kWh"],
  ["Natural Gas", "m3"],
  ["Transportation", "km"],
  ["Waste", "kg"],
  ["Water", "m3"],
  ["Diesel", "L"],
  ["Business Travel", "km"],
  ["Fuel, Diesel", "L"],
] as const;

type Row = string[];

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateRows(count: number, seed: number): Row[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, (_, index) => {
    const [category, unit] = ACTIVITIES[index % ACTIVITIES.length];
    const amount = ((1 + Math.floor(random() * 200000)) / 100).toFixed(2);
    const day = Math.floor(random() * 366);
    const date = new Date(Date.UTC(2024, 0, 1 + day)).toISOString().slice(0, 10);
    return [category, amount, unit, date];
  });
}

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function writeCsv(name: string, rows: Row[], mixedLineEndings = false): void {
  let content = `${HEADER}\n`;
  rows.forEach((row, index) => {
    const ending = mixedLineEndings && index === 4 ? "\r\n" : "\n";
    content += row.map(escapeCell).join(",") + ending;
  });
  const target = resolve(process.cwd(), name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
  console.log(`${name}: ${rows.length} data rows`);
}

const invalidRows: Row[] = [
  ["Electricity", "-10.50", "kWh", "2024-01-15"],
  ["Natural Gas", "0", "m3", "2024-01-16"],
  ["Transportation", "abc", "km", "2024-01-17"],
  ["Waste", "", "kg", "2024-01-18"],
  ["   ", "120.25", "m3", "2024-01-19"],
  ["Diesel", "25.75", "   ", "2024-01-20"],
  ["Business Travel", "250.50", "km", "2024-02-30"],
  ["Electricity", "150.50", "kWh", "15/01/2024"],
  ["Water", "85.25", "m3", ""],
  ["Waste", "45.80", "kg"],
];

const validMixedRows = generateRows(15, SEED + 1);
const mixedRows: Row[] = [];
validMixedRows.forEach((row, index) => {
  mixedRows.push(row);
  if (index < invalidRows.length) mixedRows.push(invalidRows[index]);
});

writeCsv("sample-data.csv", generateRows(60, SEED));
writeCsv("samples/sample-invalid.csv", mixedRows, true);
writeCsv("samples/sample-large.csv", generateRows(5000, SEED + 2));
