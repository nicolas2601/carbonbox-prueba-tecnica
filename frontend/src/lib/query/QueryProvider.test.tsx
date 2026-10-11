import { render } from "@testing-library/react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { expect, it } from "vitest";
import { ApiError } from "@/lib/api/ApiError";
import { getStats } from "@/lib/api/uploads";
import { uploadKeys } from "@/lib/api/uploadKeys";
import { API_URL, server } from "@/tests/server";
import { getQueryClient, makeQueryClient, QueryProvider, shouldRetryQuery } from "./QueryProvider";

it("Preserves one browser query client across provider renders", () => {
  const clients: QueryClient[] = [];
  function Probe() { clients.push(useQueryClient()); return null; }
  const result = render(<QueryProvider><Probe /></QueryProvider>);
  result.rerender(<QueryProvider><Probe /></QueryProvider>);
  expect(clients[0]).toBe(clients[1]);
  expect(clients[0]).toBe(getQueryClient());
});
it("Does not retry a real 404 response", async () => {
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads/stats`, () => {
    calls++; return HttpResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });
  }));
  const client = makeQueryClient();
  try {
    await expect(client.fetchQuery({ queryKey: uploadKeys.stats(), queryFn: getStats })).rejects.toMatchObject({ status: 404 });
    expect(calls).toBe(1);
  } finally { client.clear(); }
});
it.each([400, 404, 413, 499])("Refuses retries for %s", status => {
  expect(shouldRetryQuery(0, new ApiError("FAILED", "Try again", status))).toBe(false);
});
it.each([0, 500, 503])("Bounds retries for status %s", status => {
  expect(shouldRetryQuery(0, new ApiError("FAILED", "Try again", status))).toBe(true);
  expect(shouldRetryQuery(2, new ApiError("FAILED", "Try again", status))).toBe(false);
});
