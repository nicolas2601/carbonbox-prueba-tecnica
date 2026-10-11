import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
it.each([["/", "Dashboard"], ["/uploads", "Uploads"], ["/uploads/one", "Uploads"]])(
  "Provides landmarks and marks the current section at %s", async (path, name) => {
    vi.mocked(usePathname).mockReturnValue(path);
    render(<AppShell><h1>Activity ledger</h1></AppShell>);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main-content");
    await userEvent.setup().tab();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveFocus();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  },
);
