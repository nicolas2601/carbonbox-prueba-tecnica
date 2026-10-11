import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { StatCard } from "./StatCard";

it("Labels a readable tabular figure and avoids a misleading interactive target", () => {
  render(<StatCard label="Total uploads" count={1234} detail="Files received" />);
  const card = screen.getByRole("article", { name: "Total uploads" });
  expect(within(card).getByText("1,234")).toHaveClass("font-display", "tabular-nums");
  expect(within(card).getByText("Files received")).toBeInTheDocument();
  expect(within(card).queryByRole("link")).not.toBeInTheDocument();
});
it("Displays zero rather than treating it as missing", () => {
  render(<StatCard label="Completed" count={0} />);
  expect(screen.getByText("0")).toBeInTheDocument();
});
