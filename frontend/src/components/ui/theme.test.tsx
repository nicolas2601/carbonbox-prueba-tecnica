import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Button } from "./button";

it("Uses Carbon Day button sizing and explicit compositor transitions", () => {
  render(<Button>Continue</Button>);
  const button = screen.getByRole("button", { name: "Continue" });
  expect(button.className).toContain("carbon-button");
  expect(button.className).not.toContain("transition-all");
});
it("Contains no neutral default theme, stray colors or unbounded component transitions", () => {
  for (const file of ["button", "card", "badge", "table", "skeleton", "sheet", "tooltip", "separator", "chart"]) {
    const source = readFileSync(`src/components/ui/${file}.tsx`, "utf8");
    expect(source, file).not.toMatch(/transition-all|#[\da-f]{3,8}\b|bg-black|text-neutral|bg-neutral/);
  }
});
