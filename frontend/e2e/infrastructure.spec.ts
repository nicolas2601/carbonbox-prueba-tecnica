import { expect, test } from "@playwright/test";

test("the owned stack starts healthy and serves the upload interface", async ({ page, request }) => {
  const api = process.env.E2E_API_URL;
  expect(api).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  const response = await request.get(`${api}/health/ready`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ready" });
  const totals = await request.get(`${api}/api/v1/uploads/stats`);
  expect(await totals.json()).toEqual({ total: 0, completed: 0, inProgress: 0, failed: 0 });
  await page.goto("/uploads/new");
  await expect(page.getByRole("heading", { name: "Upload an activity file" })).toBeVisible();
  await expect(page.getByLabel("Choose a CSV file")).toBeEnabled();
});
