import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { upload } from "@/tests/fixtures";
import { StatusTransition } from "./StatusTransition";

it("Keeps outgoing paint inert while exposing just the current state", () => {
  const renderState = (value: ReturnType<typeof upload>) => <p>{value.status}</p>;
  const view = render(<StatusTransition upload={upload("u1", "PROCESSING")} render={renderState} />);
  view.rerender(<StatusTransition upload={upload("u1", "COMPLETED")} render={renderState} />);
  expect(screen.getByText("COMPLETED")).toBeInTheDocument();
  const outgoing = screen.getByText("PROCESSING").closest('[aria-hidden="true"]');
  expect(outgoing).toHaveAttribute("inert");
});
it("Uses a 200ms opacity crossfade and suppresses both layers for reduced motion", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  expect(css).toContain("--crossfade: 200ms");
  expect(css).toContain("@keyframes panel-in");
  expect(css).toContain("@keyframes panel-out");
  expect(css).toContain(".status-transition-previous { display: none");
});
