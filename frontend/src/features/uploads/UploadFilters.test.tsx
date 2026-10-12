import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { UploadFilters } from "./UploadFilters";

afterEach(() => vi.useRealTimers());
it("Debounces filename input for 300 ms and flushes status/sort changes", () => {
  vi.useFakeTimers(); const change = vi.fn();
  render(<UploadFilters filters={{}} onChange={change} />);
  fireEvent.change(screen.getByRole("searchbox", { name: "Search filenames" }), { target: { value: "fuel" } });
  act(() => vi.advanceTimersByTime(299)); expect(change).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1)); expect(change).toHaveBeenLastCalledWith({ q: "fuel" });
  fireEvent.change(screen.getByLabelText("Status"), { target: { value: "FAILED" } });
  expect(change).toHaveBeenLastCalledWith({ q: "fuel", status: "FAILED" });
});
it("Clears pending debounce on unmount and offers a clear action for active filters", () => {
  vi.useFakeTimers(); const change = vi.fn();
  const view = render(<UploadFilters filters={{ q: "old", status: "COMPLETED" }} onChange={change} />);
  expect(screen.getByRole("searchbox")).toHaveAttribute("maxlength", "200");
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(change).toHaveBeenLastCalledWith({});
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "later" } });
  view.unmount(); act(() => vi.advanceTimersByTime(300));
  expect(change).toHaveBeenCalledTimes(1);
});
