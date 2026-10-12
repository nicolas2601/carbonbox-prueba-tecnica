export const UPLOADS_PAGE_SIZE = 10;
export const RESULTS_PAGE_SIZE = 25;

export function parsePage(value: unknown, limit = UPLOADS_PAGE_SIZE): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger((page - 1) * limit)) return 1;
  return page;
}
