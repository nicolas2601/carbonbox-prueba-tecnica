import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";

it("Labels indeterminate work without a made-up value", () => {
  render(<ProgressBar label="Processing file" detail="4 rows handled" />);
  const bar = screen.getByRole("progressbar", { name: "Processing file" });
  expect(bar).not.toHaveAttribute("aria-valuenow");
  expect(screen.getByText("4 rows handled")).toBeInTheDocument();
  expect(bar).toHaveAttribute("data-indeterminate", "true");
});
it("Stops sliding under reduced motion and never animates width", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  expect(css).toContain("@keyframes processing-slide");
  expect(css).toContain('.progress-track[data-indeterminate="true"] .progress-fill { animation: none');
});
