import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { upload } from "@/tests/fixtures";
import { DashboardInsights } from "./DashboardInsights";

const stats = { total: 2, completed: 1, inProgress: 1, failed: 0, processedRows: 15, rejectedRows: 10, pending: 1, processing: 0 };
it("Exposes global row quality and explicitly approximate median terminal timing", () => {
  const items = [{ ...upload("done"), createdAt: "2026-10-12T00:00:00Z", updatedAt: "2026-10-12T00:00:03Z" }];
  render(<DashboardInsights stats={stats} uploads={items} />);
  expect(within(screen.getByRole("article", { name: "Rows handled" })).getByText("25")).toBeVisible();
  expect(within(screen.getByRole("article", { name: "Rejection rate" })).getByText("40%")).toBeVisible();
  expect(within(screen.getByRole("article", { name: "Median elapsed, approximate" })).getByText("3 s")).toBeVisible();
  expect(screen.getByText(/Includes queue time/)).toBeVisible();
  expect(within(screen.getByRole("article", { name: "Active uploads" })).getByText("1")).toBeVisible();
  expect(screen.getByText("1 pending / 0 processing")).toBeVisible();
});
it("Does not manufacture totals or durations from missing fields or an empty cohort", () => {
  render(<DashboardInsights stats={{ total: 0, completed: 0, inProgress: 0, failed: 0 }} uploads={[]} />);
  expect(within(screen.getByRole("article", { name: "Rows handled" })).getByText("Not available")).toBeVisible();
  expect(within(screen.getByRole("article", { name: "Rejection rate" })).getByText("No row totals yet")).toBeVisible();
  expect(within(screen.getByRole("article", { name: "Median elapsed, approximate" })).getByText("No terminal files")).toBeVisible();
});
it("Distinguishes unobserved recent data from an actual empty duration set", () => {
  render(<DashboardInsights stats={stats} />);
  expect(screen.getByText("Recent data unavailable")).toBeVisible();
});
