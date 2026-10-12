import { readFileSync } from "node:fs";
import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StatusBadge } from "./StatusBadge";

afterEach(() => vi.unstubAllGlobals());
it.each(["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const)("Labels %s without relying on color", status => {
  render(<StatusBadge status={status} />);
  const badge = screen.getByText(status[0] + status.slice(1).toLowerCase());
  expect(badge).toHaveAttribute("data-status", status);
  const css = readFileSync("src/app/globals.css", "utf8");
  expect(css).toContain(`color: var(--${status.toLowerCase()})`);
  expect(css).toContain(`background: var(--${status.toLowerCase()}-bg)`);
});
it("Pulses processing only while visible and cleans up its observer", () => {
  let notify: (visible: boolean) => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) {
      notify = visible => callback([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
    observe() {}
    disconnect = disconnect;
  });
  const view = render(<StatusBadge status="PROCESSING" />);
  const badge = screen.getByText("Processing");
  expect(badge).toHaveAttribute("data-visible", "false");
  act(() => notify(true));
  expect(badge).toHaveAttribute("data-visible", "true");
  act(() => notify(false));
  expect(badge).toHaveAttribute("data-visible", "false");
  view.unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});
it("Makes reduced motion static and limits animation to opacity", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  expect(css).toContain("prefers-reduced-motion: reduce");
  expect(css).toContain(".status-dot { animation: none");
  expect(css).toContain('@keyframes status-pulse');
});
