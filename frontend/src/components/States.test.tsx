import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/ApiError";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Skeleton } from "./Skeleton";

it("Shows an actionable error and correlated request id without stack details", async () => {
  const retry = vi.fn();
  render(<ErrorState error={new ApiError("FAILED", "The server is unavailable", 503, "req-123")} onRetry={retry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("The server is unavailable");
  expect(screen.getByText("Request req-123")).toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledOnce();
});
it("Omits absent request ids and gives empty views one action", () => {
  const view = render(<ErrorState error={new ApiError("FAILED", "Try again", 400)} onRetry={vi.fn()} />);
  expect(screen.queryByText(/^Request /)).not.toBeInTheDocument();
  view.rerender(<EmptyState title="No uploads yet" message="Start your activity ledger with a CSV file." />);
  expect(screen.getByText("No uploads yet")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Upload a file" })).toHaveAttribute("href", "/uploads/new");
});
it.each(["stats", "table"] as const)("Announces %s loading and hides decorative placeholders", kind => {
  render(<Skeleton kind={kind} />);
  expect(screen.getByRole("status")).toHaveAccessibleName(kind === "stats" ? "Loading totals" : "Loading uploads");
  expect(screen.getByRole("status").querySelector('[aria-hidden="true"]')).not.toBeNull();
});
