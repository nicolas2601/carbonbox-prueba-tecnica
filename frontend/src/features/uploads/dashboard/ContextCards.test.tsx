import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { upload } from "@/tests/fixtures";
import { LargestUploadsCard } from "./LargestUploadsCard";
import { CompletionArcCard } from "./CompletionArcCard";

it("Lists actual largest recent uploads with counts and detail links", () => {
  const items = [5, 20, 15].map((rows, index) => ({ ...upload(String(index)), processedRows: rows, failedRows: 0 }));
  render(<LargestUploadsCard uploads={items} />);
  const list = screen.getByRole("list", { name: "Largest recent uploads" });
  expect(within(list).getAllByRole("link").map(link => link.textContent)).toEqual(["1.csv", "2.csv", "0.csv"]);
  expect(within(list).getByText("20")).toBeVisible();
  expect(within(list).getByRole("link", { name: "1.csv" })).toHaveAttribute("href", "/uploads/1");
  expect(screen.getByText("Rows handled in the last 12 files")).toBeVisible();
});
it("Distinguishes loading from zero observed rows", () => {
  const view = render(<LargestUploadsCard loading />);
  expect(screen.getByRole("status", { name: "Loading largest uploads" })).toBeVisible();
  view.rerender(<LargestUploadsCard uploads={[]} />);
  expect(screen.getByText("No handled rows yet")).toBeVisible();
});
it("Labels the completion arc with real global counts and share", () => {
  render(<CompletionArcCard stats={{ total: 4, completed: 3, inProgress: 1, failed: 0 }} />);
  expect(screen.getByText("75%")).toBeVisible();
  expect(screen.getByText("3 of 4 uploads completed")).toBeVisible();
  expect(screen.getByRole("img", { name: "75 percent of uploads completed" })).toBeVisible();
});
