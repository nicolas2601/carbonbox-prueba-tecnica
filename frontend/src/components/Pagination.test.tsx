import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

it("Disables ends, displays pages and calls navigation with the next number", async () => {
  const onPageChange = vi.fn();
  const view = render(<Pagination page={1} limit={10} total={21} onPageChange={onPageChange} />);
  expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  await userEvent.setup().click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange).toHaveBeenLastCalledWith(2);
  view.rerender(<Pagination page={3} limit={10} total={21} onPageChange={onPageChange} />);
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  await userEvent.setup().click(screen.getByRole("button", { name: "Previous" }));
  expect(onPageChange).toHaveBeenLastCalledWith(2);
});
it("Handles empty results and disables controls during page transitions", () => {
  const view = render(<Pagination page={1} limit={10} total={0} onPageChange={vi.fn()} />);
  expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  view.rerender(<Pagination page={2} limit={10} total={30} disabled onPageChange={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});
