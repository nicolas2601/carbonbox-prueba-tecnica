import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { BeforeYouUpload } from "./BeforeYouUpload";

it("explains the required columns, row rules, upload limit and sample file", () => {
  render(<BeforeYouUpload />);
  expect(screen.getByRole("heading", { name: "Before you upload" })).toBeInTheDocument();
  expect(screen.getByText("category, amount, unit, date")).toBeInTheDocument();
  expect(screen.getByText("Amount must be a decimal greater than zero")).toBeInTheDocument();
  expect(screen.getByText("Date must use YYYY-MM-DD")).toBeInTheDocument();
  expect(screen.getByText("Maximum file size: 10 MB")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Download sample CSV" })).toHaveAttribute("href", "/sample-activity.csv");
});
