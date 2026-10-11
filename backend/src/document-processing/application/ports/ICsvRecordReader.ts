export interface CsvRecord { line: number; fields: string[]; }
export interface ICsvRecordReader {
  read(stream: AsyncIterable<Uint8Array>): AsyncIterable<CsvRecord>;
}
