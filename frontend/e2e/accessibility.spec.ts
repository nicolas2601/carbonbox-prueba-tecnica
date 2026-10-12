import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import { seedUpload, waitForWork } from "./helpers";

test("dashboard, list, upload and both terminal detail panels have no serious axe violations", async ({ page, request }) => {
  const completed = await seedUpload(request, "valid.csv");
  const failed = await seedUpload(request, "failed.csv", Buffer.from("category,amount,date\nWater,10,2024-01-15\n"));
  await waitForWork(request);
  const routes = [
    { path: "/", ready: () => page.getByRole("article", { name: "Total uploads", exact: true }) },
    { path: "/uploads", ready: () => page.getByRole("table", { name: "All uploads" }) },
    { path: "/uploads/new", ready: () => page.getByRole("heading", { name: "Upload an activity file" }) },
    { path: `/uploads/${completed}`, ready: () => page.getByRole("table", { name: "Processed rows" }) },
    { path: `/uploads/${failed}`, ready: () => page.getByRole("heading", { name: "This file could not be processed" }) },
  ];
  for (const route of routes) {
    await page.goto(route.path);
    await expect(route.ready()).toBeVisible();
    const audit = await new AxeBuilder({ page }).analyze();
    const blocking = audit.violations.filter(issue => issue.impact === "serious" || issue.impact === "critical");
    expect(blocking, `Accessibility at ${route.path}: ${JSON.stringify(blocking)}`).toEqual([]);
  }
});
