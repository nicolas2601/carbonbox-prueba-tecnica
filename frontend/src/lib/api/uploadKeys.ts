const all = ["uploads"] as const;
export const uploadKeys = {
  all,
  stats: () => [...all, "stats"] as const,
  list: (page: number, limit: number) => [...all, "list", { page, limit }] as const,
  detail: (id: string) => [...all, "detail", id] as const,
  results: (id: string, page: number, limit: number) => [...all, "results", id, { page, limit }] as const,
};
