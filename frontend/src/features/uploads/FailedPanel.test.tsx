import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { upload } from "@/tests/fixtures";
import { FailedPanel } from "./FailedPanel";

it("Shows the server reason and a recovery route, not a results table", () => {
  render(<FailedPanel upload={{ ...upload("u1", "FAILED"), errorMessage: "Missing required column: unit" }} />);
  expect(screen.getByRole("heading", { name: "This file could not be processed" })).toBeInTheDocument();
  expect(screen.getByText("Missing required column: unit")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Upload another file" })).toHaveAttribute("href", "/uploads/new");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("Provides a concrete fallback when no server reason is available", () => {
  render(<FailedPanel upload={{ ...upload("u1", "FAILED"), errorMessage: null }} />);
  expect(screen.getByText(/Check the CSV headers/)).toBeInTheDocument();
});
