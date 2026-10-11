import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { makeQueryClient } from "@/lib/query/QueryProvider";

export function queryHarness() {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false, gcTime: Infinity } });
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, wrapper };
}
