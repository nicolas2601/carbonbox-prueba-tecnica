import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parse, type InfoRecord } from "csv-parse";
import type { ICsvRecordReader, CsvRecord } from "../../application/ports/ICsvRecordReader";

interface ParsedRecord { record: string[]; info: InfoRecord; }

export class CsvParseRecordReader implements ICsvRecordReader {
  async *read(stream: AsyncIterable<Uint8Array>): AsyncIterable<CsvRecord> {
    const source = Readable.from(stream);
    const parser = parse({ info: true });
    const pumping = pipeline(source, parser);
    void pumping.catch(() => undefined);
    try {
      for await (const item of parser as AsyncIterable<ParsedRecord>) {
        yield { line: item.info.lines, fields: item.record };
      }
    } finally {
      source.destroy();
      parser.destroy();
      await pumping.catch(() => undefined);
    }
  }
}
