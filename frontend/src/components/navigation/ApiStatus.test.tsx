import { act, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { expect, it, vi } from "vitest";
import { server } from "@/tests/server";
import { queryHarness } from "@/tests/queryHarness";
import { ApiStatus } from "./ApiStatus";

it("Reads readiness cross-origin and updates at 30 seconds", async () => {
  vi.useFakeTimers();
  let calls = 0;
  server.use(http.get("http://localhost:3001/health/ready", () => ++calls === 1 ? HttpResponse.json({ status: "ready" }) : HttpResponse.json({ error: { code: "SERVICE_UNAVAILABLE" } }, { status: 503 })));
  const view = render(<ApiStatus />, { wrapper: queryHarness().wrapper });
  await vi.waitFor(() => expect(screen.getByText("API online")).toBeInTheDocument());
  await act(() => vi.advanceTimersByTimeAsync(30000));
  await vi.waitFor(() => expect(screen.getByText("API not reachable")).toBeInTheDocument());
  expect(calls).toBe(2);
  view.unmount();
});
