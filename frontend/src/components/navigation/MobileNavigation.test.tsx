import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { expect, it, vi } from "vitest";
import { server } from "@/tests/server";
import { queryHarness } from "@/tests/queryHarness";
import { MobileNavigation } from "./MobileNavigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/uploads" }));
it("Opens a themed drawer, traps focus and restores the trigger after Escape", async () => {
  server.use(http.get("http://localhost:3001/api/v1/uploads/stats", () => HttpResponse.json({ total: 0, completed: 0, inProgress: 0, failed: 0 })),
    http.get("http://localhost:3001/health/ready", () => HttpResponse.json({ status: "ready" })));
  render(<MobileNavigation />, { wrapper: queryHarness().wrapper });
  const trigger = screen.getByRole("button", { name: "Open navigation" });
  const user = userEvent.setup();
  await user.click(trigger);
  expect(screen.getByRole("dialog", { name: "Workspace" })).toHaveClass("carbon-sheet");
  expect(screen.getByRole("link", { name: "Uploads" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("heading", { name: "Workspace" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("link", { name: "Dashboard" })).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole("button", { name: "Close navigation" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("link", { name: "Dashboard" })).toHaveFocus();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
});
