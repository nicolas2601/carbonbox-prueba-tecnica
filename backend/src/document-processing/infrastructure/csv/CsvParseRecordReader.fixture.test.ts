import { createReadStream } from "node:fs";
import { expect, it } from "vitest";
import { CsvParseRecordReader } from "./CsvParseRecordReader";
import { validateHeader } from "../../application/csv/validateHeader";
import { validateRow } from "../../application/csv/validateRow";
import type { CsvColumns, RowError } from "../../application/csv/types";

it("Fixture lines match EXPECTED.md with quoted comma and mixed CRLF", async () => {
  const file = new URL("../../../../../samples/sample-invalid.csv", import.meta.url);
  let columns: CsvColumns | null = null;
  let valid = 0;
  const errors: RowError[] = [];
  for await (const record of new CsvParseRecordReader().read(createReadStream(file))) {
    if (!columns) {
      const header = validateHeader(record.fields);
      if (header.isLeft()) throw header.value;
      columns = header.value;
      continue;
    }
    const result = validateRow(record.fields, columns, record.line);
    if (result.isLeft()) errors.push(result.value);
    else valid++;
  }
  expect(valid).toBe(15);
  expect(errors.map(error => error.line)).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19, 21]);
});
