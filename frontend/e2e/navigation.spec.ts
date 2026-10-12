import { test, expect } from "./fixtures";
import { seedUpload, waitForWork } from "./helpers";

test("dashboard totals and twelve-file pagination follow actual stored data", async ({ page, request }) => {
  for (let i = 0; i < 12; i++) await seedUpload(request, `record-${i}.csv`);
  await waitForWork(request);
  await page.goto("/");
  await expect(page.getByRole("article", { name: "Total uploads", exact: true })).toContainText("12");
  await expect(page.getByRole("article", { name: "Completed", exact: true })).toContainText("12");
  await page.getByRole("link", { name: "Uploads", exact: true }).click();
  await expect(page.getByRole("table", { name: "All uploads" }).locator("tbody tr")).toHaveCount(10);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByText("Page 2 of 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: "All uploads" }).locator("tbody tr")).toHaveCount(2);
});
test("unknown upload is actionable and never polls", async ({ page }) => {
  let requests = 0;
  page.on("request", req => { if (req.url().includes("/api/v1/uploads/does-not-exist")) requests++; });
  await page.goto("/uploads/does-not-exist");
  await expect(page.getByRole("heading", { name: "Upload not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to uploads" })).toBeVisible();
  expect(requests).toBe(1);
});
test("dashboard polls queued data and refreshes when the worker completes it", async ({ page, request }) => {
  const group = Number(process.env.E2E_WORKER_GROUP);
  expect(Number.isSafeInteger(group) && group > 1).toBe(true);
  process.kill(-group, "SIGSTOP");
  try {
    await seedUpload(request, "queued.csv");
    await page.goto("/");
    await expect(page.getByRole("article", { name: "In progress", exact: true })).toContainText("1");
    await expect(page.getByRole("cell", { name: "Pending", exact: true })).toBeVisible();
  } finally { process.kill(-group, "SIGCONT"); }
  await expect(page.getByRole("article", { name: "Completed", exact: true })).toContainText("1");
  await expect(page.getByRole("article", { name: "In progress", exact: true })).toContainText("0");
});
