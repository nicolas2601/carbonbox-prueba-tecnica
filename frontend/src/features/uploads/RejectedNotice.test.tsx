import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { RejectedNotice } from "./RejectedNotice";

it("Explains retained valid rows and lists the bounded summary lines", () => {
  render(<RejectedNotice count={10} summary="10 rows rejected. line 3: amount - Must be positive; line 5: date - Invalid date" />);
  expect(screen.getByRole("note")).toHaveTextContent("10 rows rejected");
  expect(screen.getByRole("note")).toHaveTextContent("Valid rows were kept");
  expect(screen.getAllByRole("listitem").map(item => item.textContent)).toEqual([
    "line 3: amount - Must be positive", "line 5: date - Invalid date",
  ]);
});
it("Does not show a notice when no rows were rejected", () => {
  render(<RejectedNotice count={0} summary={null} />);
  expect(screen.queryByRole("note")).not.toBeInTheDocument();
});
it("Handles a missing summary without inventing rejection details", () => {
  render(<RejectedNotice count={2} summary={null} />);
  expect(screen.getByRole("note")).toHaveTextContent("2 rows rejected");
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
});
