import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { expect, it, vi } from "vitest";
import { upload } from "@/tests/fixtures";
import { UploadsTable } from "@/features/uploads/UploadsTable";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";

vi.mock("next/link", () => ({ default: ({ prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) =>
  <a {...props} data-prefetch={String(prefetch)} /> }));
it("Does not preload not-yet-implemented creation or detail routes", () => {
  render(<>
    <PageHeader title="Uploads" description="Activity ledger" />
    <EmptyState title="No uploads yet" message="Choose a CSV" />
    <UploadsTable uploads={[upload()]} caption="Uploads" detailed />
  </>);
  for (const link of screen.getAllByRole("link")) expect(link).toHaveAttribute("data-prefetch", "false");
});
