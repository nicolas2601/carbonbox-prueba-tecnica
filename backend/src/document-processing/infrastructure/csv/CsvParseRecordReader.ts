import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parse, type InfoRecord } from "csv-parse";
import type { ICsvRecordReader, CsvRecord } from "../../application/ports/ICsvRecordReader";

interface ParsedRecord { record: string[]; raw: string; info: InfoRecord; }

export class CsvParseRecordReader implements ICsvRecordReader {
  async *read(stream: AsyncIterable<Uint8Array>): AsyncIterable<CsvRecord> {
    const source = Readable.from(stream);
    const parser = parse({ info: true, raw: true });
    const pumping = pipeline(source, parser);
    void pumping.catch(() => undefined);
    let nextLine = 1;
    try {
      for await (const item of parser as AsyncIterable<ParsedRecord>) {
        const line = nextLine;
        // Info.lines counts record ends and can double-count quoted CRLF.
        nextLine += item.raw.match(/\r\n|\r|\n/g)?.length ?? 0;
        yield { line, fields: item.record };
      }
    } finally {
      source.destroy();
      parser.destroy();
      await pumping.catch(() => undefined);
    }
  }
}
