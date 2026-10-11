export interface MultipartTestPart { name: string; filename?: string; data: string | Uint8Array; }
export function multipart(parts: MultipartTestPart[]): { payload: Buffer; headers: { "content-type": string } } {
  const boundary = "carbonbox-test-boundary";
  const chunks: Buffer[] = [];
  for (const part of parts) {
    const filename = part.filename === undefined ? "" : `; filename="${part.filename}"`;
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"${filename}\r\n`));
    if (part.filename !== undefined) chunks.push(Buffer.from("Content-Type: text/csv\r\n"));
    chunks.push(Buffer.from("\r\n"), Buffer.from(part.data), Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { payload: Buffer.concat(chunks), headers: { "content-type": `multipart/form-data; boundary=${boundary}` } };
}
