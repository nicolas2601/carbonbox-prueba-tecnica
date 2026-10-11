export const UPLOADS_PAGE_SIZE = 10;

export function parsePage(value: unknown): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger((page - 1) * UPLOADS_PAGE_SIZE)) return 1;
  return page;
}
