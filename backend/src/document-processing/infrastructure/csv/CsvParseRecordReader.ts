import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { CsvError, parse, type InfoRecord } from "csv-parse";
import { MalformedCsvError } from "../../application/csv/MalformedCsvError";
import type { ICsvRecordReader, CsvRecord } from "../../application/ports/ICsvRecordReader";

interface ParsedRecord { record: string[]; raw: string; info: InfoRecord; }
const MAX_RECORD_SIZE = 1024 * 1024;

export class CsvParseRecordReader implements ICsvRecordReader {
  constructor(private readonly maxRecordSize = MAX_RECORD_SIZE) {}
  async *read(stream: AsyncIterable<Uint8Array>): AsyncIterable<CsvRecord> {
    const source = Readable.from(stream);
    const parser = parse({ info: true, raw: true, bom: true, relax_column_count: true, skip_empty_lines: true,
      max_record_size: this.maxRecordSize });
    const pumping = pipeline(source, parser);
    void pumping.catch(() => undefined);
    let nextLine = 1;
    let skippedEmpty = 0;
    try {
      for await (const item of parser as AsyncIterable<ParsedRecord>) {
        const line = nextLine + item.info.empty_lines - skippedEmpty;
        skippedEmpty = item.info.empty_lines;
        // Info.lines counts record ends and can double-count quoted CRLF.
        nextLine += item.raw.match(/\r\n|\r|\n/g)?.length ?? 0;
        yield { line, fields: item.record };
      }
    } catch (error) {
      if (error instanceof CsvError) throw new MalformedCsvError();
      throw error;
    } finally {
      source.destroy();
      parser.destroy();
      await pumping.catch(() => undefined);
    }
  }
}
