import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ActivityTooltip } from "./ActivityTooltip";
import { activityPoints } from "./chartModels";
import { upload } from "@/tests/fixtures";

it("Exposes full filename, processed/rejected counters, handled rows and real status", () => {
  const point = activityPoints([{ ...upload("mixed"), fileName: "a-long-activity-report.csv", processedRows: 15, failedRows: 10 }])[0];
  render(<ActivityTooltip active payload={[{ payload: point }]} />);
  expect(screen.getByText("a-long-activity-report.csv")).toBeVisible();
  for (const label of ["Processed", "Rejected", "Rows handled", "Status"]) expect(screen.getByText(label)).toBeVisible();
  for (const value of ["15", "10", "25", "Completed"]) expect(screen.getByText(value)).toBeVisible();
});
it("Does not invent counters for an unreported pending file or render an inactive tooltip", () => {
  const point = activityPoints([{ ...upload("pending", "PENDING"), processedRows: null, failedRows: null }])[0];
  const { rerender, container } = render(<ActivityTooltip active payload={[{ payload: point }]} />);
  expect(screen.getByText("No rows reported yet")).toBeVisible();
  expect(screen.getByText("Pending")).toBeVisible();
  rerender(<ActivityTooltip active={false} />);
  expect(container).toBeEmptyDOMElement();
});
