import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { LogoMark, Lockup } from "./LogoMark";

it("Names the standalone mark and hides the decorative mark in its lockup", () => {
  const view = render(<LogoMark />);
  expect(screen.getByRole("img", { name: "CarbonBox" })).toHaveAttribute("viewBox", "0 0 48 48");
  view.rerender(<Lockup />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText("Carbon")).toBeInTheDocument();
  expect(screen.getByText("Box")).toBeInTheDocument();
});
it("Uses the canonical SVG geometry for its sprite and icon exports", () => {
  const source = readFileSync("assets/logo-mark.svg", "utf8");
  const exported = readFileSync("public/favicon.svg", "utf8");
  for (const path of source.match(/<path[^>]+\/>/g) ?? []) expect(exported).toContain(path);
  expect(exported).toContain('id="carbonbox-mark"');
  expect(readFileSync("public/apple-touch-icon.png").byteLength).toBeGreaterThan(100);
});
it("Replaces the scaffold ICO with one canonical 32 px icon", () => {
  const icon = readFileSync("src/app/favicon.ico");
  expect(icon.readUInt16LE(4)).toBe(1);
  expect(icon[6]).toBe(32);
  expect(icon.subarray(22, 30)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});
