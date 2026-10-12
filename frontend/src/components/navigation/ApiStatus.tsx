"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const READINESS_POLL_MS = 30000;
async function ready(): Promise<boolean> {
  const baseURL = api.defaults.baseURL?.replace(/\/api\/v1\/?$/, "");
  try { return (await api.get<{ status: string }>("/health/ready", { baseURL })).data.status === "ready"; }
  catch { return false; }
}
export function ApiStatus() {
  const query = useQuery({ queryKey: ["api-readiness"], queryFn: ready, retry: false, refetchInterval: READINESS_POLL_MS });
  const text = query.isPending ? "Checking API" : query.data ? "API online" : "API not reachable";
  return <TooltipProvider><Tooltip><TooltipTrigger asChild>
    <span tabIndex={0} className="api-status"><span aria-hidden="true" className="api-dot" data-online={Boolean(query.data)} />{text}</span>
  </TooltipTrigger><TooltipContent>Readiness checked every 30 seconds</TooltipContent></Tooltip></TooltipProvider>;
}
