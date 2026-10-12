import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { upload } from "@/tests/fixtures";
import { UploadsTable } from "./UploadsTable";

it("Keeps the file, status and date together in one narrow-screen record", () => {
  render(<UploadsTable uploads={[upload()]} caption="All uploads" detailed />);
  const row = within(screen.getByRole("table")).getAllByRole("row")[1];
  expect(row.querySelector('[data-column="file"]')).toHaveTextContent("u1.csv");
  expect(row.querySelector('[data-column="status"]')).toHaveTextContent("Completed");
  expect(row.querySelector('[data-column="date"]')).toHaveTextContent("Oct 12, 2024");
});
it("Stacks upload rows below 640px without requiring horizontal status scrolling", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  expect(css).toContain("@media (max-width: 639px)");
  expect(css).toContain('.uploads-table [data-column="file"] { grid-column: 1 / -1');
  expect(css).toContain('.uploads-table [data-column="status"] { grid-column: 1');
  expect(css).toContain('.uploads-table [data-column="date"] { grid-column: 2');
});
