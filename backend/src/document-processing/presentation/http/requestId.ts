import type { IIdGenerator } from "../../application/ports/IIdGenerator";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;
export function requestId(value: unknown, ids: IIdGenerator): string {
  return typeof value === "string" && SAFE_REQUEST_ID.test(value) ? value : ids.next();
}
