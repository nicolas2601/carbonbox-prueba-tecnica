import { FileTooLargeError } from "./FileTooLargeError";

export class ByteLimiter {
  exceeded = false;
  constructor(private readonly source: AsyncIterable<Uint8Array>, private readonly maxBytes: number) {}
  async *read(): AsyncIterable<Uint8Array> {
    let bytes = 0;
    for await (const chunk of this.source) {
      bytes += chunk.byteLength;
      if (bytes > this.maxBytes) { this.exceeded = true; throw new FileTooLargeError(); }
      yield chunk;
    }
  }
}
