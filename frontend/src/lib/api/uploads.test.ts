// @vitest-environment node

import { http, HttpResponse } from "msw/http";
import { expect, it, vi } from "vitest";
import { API_URL, server } from "@/tests/server";
import { page, upload } from "@/tests/fixtures";
import { createUpload, getStats, getUpload, getUploadResults, listUploads, uploadPercent } from "./uploads";
import { uploadKeys } from "./uploadKeys";

it("Requests each typed read resource with pagination and isolated ids", async () => {
  const rows = [{ category: "Water", amount: 10, unit: "m3", date: "2024-01-15" }];
  server.use(
    http.get(`${API_URL}/uploads/stats`, () => HttpResponse.json({ total: 1, completed: 1, inProgress: 0, failed: 0 })),
    http.get(`${API_URL}/uploads`, ({ request }) => {
      expect(new URL(request.url).searchParams.get("page")).toBe("2");
      expect(new URL(request.url).searchParams.get("limit")).toBe("10");
      return HttpResponse.json(page([upload()], 11, 2));
    }),
    http.get(`${API_URL}/uploads/u1`, () => HttpResponse.json(upload())),
    http.get(`${API_URL}/uploads/u1/results`, ({ request }) => {
      expect(new URL(request.url).searchParams.get("limit")).toBe("25");
      return HttpResponse.json(page(rows, 1, 1, 25));
    }),
  );
  expect((await getStats()).completed).toBe(1);
  expect((await listUploads(2, 10)).page).toBe(2);
  expect((await getUpload("u1")).id).toBe("u1");
  expect((await getUploadResults("u1", 1, 25)).data).toEqual(rows);
});
it("Posts file as multipart and reports bounded upload progress", async () => {
  server.use(http.post(`${API_URL}/uploads`, async ({ request }) => {
    expect(request.headers.get("content-type")).toContain("multipart/form-data; boundary=");
    const body = await request.text();
    expect(body).toContain('name="file"; filename="data.csv"');
    expect(body).toContain("category,amount,unit,date");
    return HttpResponse.json({ id: "new", status: "PENDING", fileName: "data.csv", createdAt: "2024-10-12T10:00:00.000Z" }, { status: 201 });
  }));
  const progress = vi.fn();
  expect((await createUpload(new File(["category,amount,unit,date"], "data.csv"), progress)).status).toBe("PENDING");
  expect(progress).toHaveBeenLastCalledWith(100);
  for (const [value] of progress.mock.calls) expect(value).toBeGreaterThanOrEqual(0);
});
it.each([[50, 100, 50], [200, 100, 100], [-1, 100, 0], [1, 0, undefined], [1, undefined, undefined], [NaN, 10, undefined]])(
  "Handles progress loaded=%s total=%s", (loaded, total, expected) => expect(uploadPercent(loaded!, total)).toBe(expected),
);
it("Builds stable, distinct keys under the shared invalidation root", () => {
  expect(uploadKeys.list(1, 10)).toEqual(uploadKeys.list(1, 10));
  const keys = [uploadKeys.stats(), uploadKeys.list(1, 10), uploadKeys.detail("u1"), uploadKeys.results("u1", 1, 10), uploadKeys.results("u2", 1, 10)];
  expect(new Set(keys.map(key => JSON.stringify(key))).size).toBe(keys.length);
  for (const key of keys) expect(key.slice(0, uploadKeys.all.length)).toEqual(uploadKeys.all);
});
it("Threads AbortSignal through Axios and preserves cancellation instead of a network failure", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(createUpload(new File(["data"], "data.csv"), undefined, controller.signal)).rejects.toMatchObject({ code: "CANCELLED" });
});
