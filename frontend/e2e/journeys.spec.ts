import { test, expect } from "./fixtures";
import { expectCompleted, MIXED_CSV, uploadFromPage, VALID_CSV } from "./helpers";

test("valid CSV redirects, completes and paginates 60 rows", async ({ page }) => {
  await uploadFromPage(page, VALID_CSV);
  await expectCompleted(page);
  await expect(page.getByRole("table", { name: "Processed rows" }).locator("tbody tr")).toHaveCount(25);
  await expect(page.getByText("Page 1 of 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByText("Page 2 of 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: "Processed rows" }).locator("tbody tr")).toHaveCount(25);
});
test("mixed CSV keeps 15 valid rows and explains 10 rejections", async ({ page }) => {
  await uploadFromPage(page, MIXED_CSV);
  await expectCompleted(page);
  await expect(page.getByRole("article", { name: "Processed rows", exact: true })).toContainText("15");
  await expect(page.getByRole("note", { name: "Rejected rows" })).toContainText("10 rows rejected");
  await expect(page.getByRole("note", { name: "Rejected rows" }).getByRole("listitem")).toHaveCount(10);
  await expect(page.getByRole("table", { name: "Processed rows" }).locator("tbody tr")).toHaveCount(15);
});
test("missing unit column reaches the failed panel", async ({ page }) => {
  await uploadFromPage(page, { name: "wrong-header.csv", mimeType: "text/csv", buffer: Buffer.from("category,amount,date\nWater,10,2024-01-15\n") });
  await expect(page.getByRole("status", { name: "Upload status" })).toHaveText("Upload failed");
  await expect(page.getByRole("heading", { name: "This file could not be processed" })).toBeVisible();
  await expect(page.getByText(/Missing.*unit/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Upload another file" })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
