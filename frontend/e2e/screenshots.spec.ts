import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { test, expect } from "./fixtures";
import { seedUpload, waitForWork } from "./helpers";

test("@screenshot curated README pages at desktop and mobile widths", async ({ page, request }) => {
  const completed = await seedUpload(request, "activity-data.csv");
  const failed = await seedUpload(request, "missing-column.csv", Buffer.from("category,amount,date\nWater,10,2024-01-15\n"));
  await waitForWork(request);
  const output = fileURLToPath(new URL("../../docs/screenshots", import.meta.url));
  await mkdir(output, { recursive: true });
  const routes = [
    { name: "dashboard", path: "/", ready: () => page.getByRole("article", { name: "Total uploads", exact: true }) },
    { name: "uploads", path: "/uploads", ready: () => page.getByRole("table", { name: "All uploads" }) },
    { name: "upload", path: "/uploads/new", ready: () => page.getByRole("heading", { name: "Upload an activity file" }) },
    { name: "detail-completed", path: `/uploads/${completed}`, ready: () => page.getByRole("table", { name: "Processed rows" }) },
    { name: "detail-failed", path: `/uploads/${failed}`, ready: () => page.getByRole("heading", { name: "This file could not be processed" }) },
  ];
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route.path);
      await expect(route.ready()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: join(output, `${route.name}-${width}.png`), fullPage: true, animations: "disabled" });
    }
  }
});
