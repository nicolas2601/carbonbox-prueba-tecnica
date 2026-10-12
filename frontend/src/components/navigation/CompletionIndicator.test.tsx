import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CompletionIndicator } from "./CompletionIndicator";

vi.mock("@/features/uploads/dashboard/chartModels", () => ({ completionShare: (stats: { total: number; completed: number }) => stats.total ? Math.round(stats.completed / stats.total * 100) : 0 }));

it("shows the four global upload counts and omits unavailable row totals", () => {
  render(<CompletionIndicator stats={{ total: 12, completed: 9, inProgress: 2, failed: 1 }} />);
  expect(screen.getByRole("progressbar", { name: "Completed upload share" })).toHaveAttribute("aria-valuenow", "75");
  expect(screen.getByText("Uploads")).toBeInTheDocument();
  expect(screen.getByText("Completed")).toBeInTheDocument();
  expect(screen.getByText("In progress")).toBeInTheDocument();
  expect(screen.getByText("Failed")).toBeInTheDocument();
  expect(screen.queryByText("Rows processed")).not.toBeInTheDocument();
  expect(screen.queryByText("Rows rejected")).not.toBeInTheDocument();
});

it("shows optional global row totals with compact values", () => {
  render(<CompletionIndicator stats={{ total: 12, completed: 9, inProgress: 2, failed: 1, processedRows: 1250, rejectedRows: 24 }} />);
  expect(screen.getByText("Rows processed")).toBeInTheDocument();
  expect(screen.getByText("1.3K")).toBeInTheDocument();
  expect(screen.getByText("Rows rejected")).toBeInTheDocument();
  expect(screen.getByText("24")).toBeInTheDocument();
});

it("shows each optional row aggregate independently when provided", () => {
  const { rerender } = render(<CompletionIndicator stats={{ total: 2, completed: 1, inProgress: 0, failed: 1, processedRows: 1250 }} />);
  expect(screen.getByText("Rows processed")).toBeInTheDocument();
  expect(screen.getByText("1.3K")).toBeInTheDocument();
  expect(screen.queryByText("Rows rejected")).not.toBeInTheDocument();
  rerender(<CompletionIndicator stats={{ total: 2, completed: 1, inProgress: 0, failed: 1, rejectedRows: 24 }} />);
  expect(screen.queryByText("Rows processed")).not.toBeInTheDocument();
  expect(screen.getByText("Rows rejected")).toBeInTheDocument();
  expect(screen.getByText("24")).toBeInTheDocument();
});
