import { act, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { CountUp } from "./CountUp";
import { SpotlightCard } from "./SpotlightCard";

let reducedMotion = true;
vi.mock("motion/react", async importOriginal => ({ ...await importOriginal<object>(), useReducedMotion: () => reducedMotion }));
it("Shows the final formatted figure without counting under reduced motion", () => {
  render(<CountUp value={1234} />);
  expect(screen.getByText("1,234")).toHaveAttribute("aria-hidden", "true");
});
it("Keeps content and removes the moving highlight under reduced motion", () => {
  const { container } = render(<SpotlightCard><h2>Activity</h2></SpotlightCard>);
  expect(screen.getByRole("heading", { name: "Activity" })).toBeInTheDocument();
  expect(container.querySelector(".spotlight-glow")).toHaveStyle({ visibility: "hidden" });
});
it("Hydrates the spotlight card without a mismatch when reduced motion is enabled", async () => {
  const container = document.createElement("div");
  reducedMotion = false;
  container.innerHTML = renderToString(<SpotlightCard><h2>Activity</h2></SpotlightCard>);
  reducedMotion = true;
  const onRecoverableError = vi.fn();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, <SpotlightCard><h2>Activity</h2></SpotlightCard>, { onRecoverableError });
  });
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
  expect(container.querySelector(".spotlight-glow")).toHaveStyle({ visibility: "hidden" });
  await act(async () => root.unmount());
  consoleError.mockRestore();
});
