import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const VALID_CSV = fileURLToPath(new URL("../../sample-data.csv", import.meta.url));
export const MIXED_CSV = fileURLToPath(new URL("../../samples/sample-invalid.csv", import.meta.url));

export async function uploadFromPage(page: Page, file: string | { name: string; mimeType: string; buffer: Buffer }): Promise<string> {
  await page.goto("/uploads/new");
  await page.getByLabel("Choose a CSV file").setInputFiles(file);
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  await expect(page).toHaveURL(/\/uploads\/[^/?]+$/);
  return new URL(page.url()).pathname.split("/").at(-1)!;
}
export async function expectCompleted(page: Page): Promise<void> {
  await expect(page.getByRole("status", { name: "Upload status" })).toHaveText("Upload completed");
  await expect(page.getByRole("table", { name: "Processed rows" })).toBeVisible();
}
export async function seedUpload(request: APIRequestContext, name = "activity.csv", content?: Buffer): Promise<string> {
  const response = await request.post(`${process.env.E2E_API_URL}/api/v1/uploads`, {
    multipart: { file: { name, mimeType: "text/csv", buffer: content ?? await readFile(VALID_CSV) } },
  });
  expect(response.status()).toBe(201);
  return (await response.json() as { id: string }).id;
}
export async function waitForWork(request: APIRequestContext): Promise<void> {
  await expect.poll(async () => (await (await request.get(`${process.env.E2E_API_URL}/api/v1/uploads/stats`)).json()).inProgress,
    { timeout: 20000 }).toBe(0);
}
