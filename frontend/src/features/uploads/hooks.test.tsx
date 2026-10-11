import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { expect, it, vi } from "vitest";
import { page, upload } from "@/tests/fixtures";
import { API_URL, server } from "@/tests/server";
import { queryHarness } from "@/tests/queryHarness";
import { useUploadDetail, useUploadResults, useUploads, useUploadStats } from "./hooks";
import { statsInterval, uploadInterval } from "./polling";

it.each(["PENDING", "PROCESSING", "COMPLETED", "FAILED", undefined] as const)("Polling interval for %s", status => {
  expect(uploadInterval(status)).toBe(status === "PENDING" || status === "PROCESSING" ? 3000 : false);
});
it("Stats interval follows active work", () => {
  expect(statsInterval({ total: 2, completed: 0, inProgress: 2, failed: 0 })).toBe(5000);
  expect(statsInterval({ total: 2, completed: 2, inProgress: 0, failed: 0 })).toBe(false);
  expect(statsInterval(undefined)).toBe(false);
});
it("Polls processing detail and stops after completion", async () => {
  vi.useFakeTimers();
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads/u1`, () => HttpResponse.json(upload("u1", ++calls === 1 ? "PROCESSING" : "COMPLETED"))));
  const harness = queryHarness();
  const result = renderHook(() => useUploadDetail("u1"), harness);
  await vi.waitFor(() => expect(result.result.current.data?.status).toBe("PROCESSING"));
  await act(() => vi.advanceTimersByTimeAsync(3000));
  await vi.waitFor(() => expect(result.result.current.data?.status).toBe("COMPLETED"));
  await act(() => vi.advanceTimersByTimeAsync(9000));
  expect(calls).toBe(2);
  result.unmount(); harness.client.clear();
});
it("Polls stats only until in-progress becomes zero", async () => {
  vi.useFakeTimers();
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads/stats`, () => HttpResponse.json({ total: 2, completed: calls ? 2 : 0, inProgress: calls++ ? 0 : 2, failed: 0 })));
  const harness = queryHarness();
  const result = renderHook(() => useUploadStats(), harness);
  await vi.waitFor(() => expect(result.result.current.data?.inProgress).toBe(2));
  await act(() => vi.advanceTimersByTimeAsync(5000));
  await vi.waitFor(() => expect(result.result.current.data?.inProgress).toBe(0));
  await act(() => vi.advanceTimersByTimeAsync(15000));
  expect(calls).toBe(2);
  result.unmount(); harness.client.clear();
});
it("Keeps previous list data while the next page is loading", async () => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  server.use(http.get(`${API_URL}/uploads`, async ({ request }) => {
    const current = Number(new URL(request.url).searchParams.get("page"));
    if (current === 2) await gate;
    return HttpResponse.json(page([upload(`u${current}`)], 11, current));
  }));
  const harness = queryHarness();
  const result = renderHook(({ current }) => useUploads(current, 10), { ...harness, initialProps: { current: 1 } });
  await waitFor(() => expect(result.result.current.data?.data[0].id).toBe("u1"));
  result.rerender({ current: 2 });
  expect(result.result.current.data?.data[0].id).toBe("u1");
  expect(result.result.current.isPlaceholderData).toBe(true);
  release();
  await waitFor(() => expect(result.result.current.data?.data[0].id).toBe("u2"));
  result.unmount(); harness.client.clear();
});
it("Reads results with the exact upload key and never requests an empty id", async () => {
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads/u1/results`, () => { calls++; return HttpResponse.json(page([])); }));
  const harness = queryHarness();
  const result = renderHook(({ id }) => useUploadResults(id, 1, 10), { ...harness, initialProps: { id: "" } });
  expect(result.result.current.fetchStatus).toBe("idle");
  result.rerender({ id: "u1" });
  await waitFor(() => expect(result.result.current.isSuccess).toBe(true));
  expect(calls).toBe(1);
  result.unmount(); harness.client.clear();
});
