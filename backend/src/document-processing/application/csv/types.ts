export type CsvField = "category" | "amount" | "unit" | "date";
export type CsvColumns = Record<CsvField, number>;

export interface RowError {
  line: number;
  field: CsvField;
  reason: string;
}

export interface ActivityRow {
  category: string;
  amount: number;
  unit: string;
  date: Date;
}
