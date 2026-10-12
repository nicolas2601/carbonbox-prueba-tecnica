import type { UploadListFilters } from "./models";

const all = ["uploads"] as const;
export const uploadKeys = {
  all,
  stats: () => [...all, "stats"] as const,
  list: (page: number, limit: number, filters: UploadListFilters = {}) => [...all, "list", { page, limit, ...filters }] as const,
  detail: (id: string) => [...all, "detail", id] as const,
  results: (id: string, page: number, limit: number) => [...all, "results", id, { page, limit }] as const,
};
