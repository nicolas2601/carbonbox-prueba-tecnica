import "@testing-library/jest-dom/vitest";
import axios from "axios";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";
import { api } from "@/lib/api/client";

// Use the native Fetch transport in jsdom; browser XHR is checked by the real smoke.
axios.defaults.adapter = "fetch";
api.defaults.adapter = "fetch";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
