import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CountUp } from "./CountUp";
import { SpotlightCard } from "./SpotlightCard";

vi.mock("motion/react", async importOriginal => ({ ...await importOriginal<object>(), useReducedMotion: () => true }));
it("Shows the final formatted figure without counting under reduced motion", () => {
  render(<CountUp value={1234} />);
  expect(screen.getByText("1,234")).toHaveAttribute("aria-hidden", "true");
});
it("Keeps content and removes the moving highlight under reduced motion", () => {
  const { container } = render(<SpotlightCard><h2>Activity</h2></SpotlightCard>);
  expect(screen.getByRole("heading", { name: "Activity" })).toBeInTheDocument();
  expect(container.querySelector(".spotlight-glow")).toBeNull();
});
