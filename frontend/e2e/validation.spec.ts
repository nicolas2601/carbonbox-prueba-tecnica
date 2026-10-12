import { readdir } from "node:fs/promises";
import { test, expect } from "./fixtures";

test("wrong extension and empty files are rejected without an API request", async ({ page }) => {
  let requests = 0;
  page.on("request", req => { if (req.method() === "POST" && req.url().includes("/api/v1/uploads")) requests++; });
  await page.goto("/uploads/new");
  await page.getByLabel("Choose a CSV file").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not CSV") });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Only .csv files");
  await expect(page.getByRole("button", { name: "Upload file", exact: true })).toBeDisabled();
  await page.getByLabel("Choose a CSV file").setInputFiles({ name: "empty.csv", mimeType: "text/csv", buffer: Buffer.alloc(0) });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("empty");
  expect(requests).toBe(0);
});
test("client hint rejects excess size before transfer", async ({ page, request }) => {
  await page.goto("/uploads/new");
  const limit = Number(process.env.E2E_FRONTEND_MAX_UPLOAD_MB ?? "10");
  await page.getByLabel("Choose a CSV file").setInputFiles({ name: "large.csv", mimeType: "text/csv", buffer: Buffer.alloc(limit * 1024 * 1024 + 1, "x") });
  await expect(page.getByRole("main").getByRole("alert")).toContainText(`${limit} MB`);
  const stats = await request.get(`${process.env.E2E_API_URL}/api/v1/uploads/stats`);
  expect((await stats.json()).total).toBe(0);
});
test("server limit remains authoritative and leaves no upload or partial file", async ({ page, request }) => {
  await page.goto("/uploads/new");
  await page.getByLabel("Choose a CSV file").setInputFiles({ name: "server-too-large.csv", mimeType: "text/csv", buffer: Buffer.alloc(2 * 1024 * 1024, "x") });
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "configured size limit" })).toBeVisible();
  const stats = await request.get(`${process.env.E2E_API_URL}/api/v1/uploads/stats`);
  expect((await stats.json()).total).toBe(0);
  expect(await readdir(process.env.E2E_STORAGE_DIR!)).toEqual([]);
});
test("cancel during a throttled transfer leaves no upload or orphan .part", async ({ page, request }) => {
  await page.goto("/uploads/new");
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", { offline: false, latency: 20, downloadThroughput: -1, uploadThroughput: 16 * 1024 });
  await page.getByLabel("Choose a CSV file").setInputFiles({ name: "cancel.csv", mimeType: "text/csv", buffer: Buffer.alloc(800 * 1024, "x") });
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  const bar = page.getByRole("progressbar", { name: "Uploading", exact: true });
  await expect.poll(async () => Number(await bar.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  expect(Number(await bar.getAttribute("aria-valuenow"))).toBeLessThan(100);
  await page.getByRole("button", { name: "Cancel upload" }).click();
  await expect(page.getByRole("button", { name: "Upload file", exact: true })).toBeEnabled();
  await expect(page.getByText("cancel.csv", { exact: true })).toBeVisible();
  await expect.poll(async () => (await (await request.get(`${process.env.E2E_API_URL}/api/v1/uploads/stats`)).json()).total).toBe(0);
  await expect.poll(() => readdir(process.env.E2E_STORAGE_DIR!)).toEqual([]);
  await session.detach();
});
