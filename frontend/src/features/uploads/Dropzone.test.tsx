import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";
import { Dropzone } from "./Dropzone";

function Harness({ disabled = false }: { disabled?: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  return <Dropzone file={file} onChange={setFile} disabled={disabled} limitMb={2} />;
}
it("Selects, shows name and size, and removes a file", async () => {
  render(<Harness />);
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("Choose a CSV file"), new File(["data"], "report.csv"));
  expect(screen.getByText("report.csv")).toBeInTheDocument();
  expect(screen.getByText("4 B")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove file" }));
  expect(screen.queryByText("report.csv")).not.toBeInTheDocument();
});
it("Accepts dropped files, tracks nested drag events and rejects several", () => {
  render(<Harness />);
  const input = screen.getByLabelText("Choose a CSV file");
  const area = input.closest("label")!;
  fireEvent.dragEnter(area); fireEvent.dragEnter(area); fireEvent.dragLeave(area);
  expect(area).toHaveAttribute("data-dragging", "true");
  fireEvent.drop(area, { dataTransfer: { files: [new File(["a"], "drop.csv")] } });
  expect(screen.getByText("drop.csv")).toBeInTheDocument();
  expect(area).toHaveAttribute("data-dragging", "false");
  fireEvent.drop(area, { dataTransfer: { files: [new File(["a"], "one.csv"), new File(["b"], "two.csv")] } });
  expect(screen.getByRole("alert")).toHaveTextContent("one CSV file");
  expect(screen.queryByText("drop.csv")).not.toBeInTheDocument();
});
it("Announces early validation and associates it with the input", async () => {
  render(<Harness />);
  const input = screen.getByLabelText("Choose a CSV file");
  await userEvent.setup({ applyAccept: false }).upload(input, new File(["no"], "notes.txt"));
  expect(screen.getByRole("alert")).toHaveTextContent("Only .csv files");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription(expect.stringContaining("Only .csv files"));
});
it("Keeps native keyboard selection and disables the area while sending", async () => {
  const view = render(<Harness />);
  await userEvent.setup().tab();
  expect(screen.getByLabelText("Choose a CSV file")).toHaveFocus();
  view.rerender(<Harness disabled />);
  const input = screen.getByLabelText("Choose a CSV file");
  expect(input).toBeDisabled();
  fireEvent.drop(input.closest("label")!, { dataTransfer: { files: [new File(["a"], "ignored.csv")] } });
  expect(screen.queryByText("ignored.csv")).not.toBeInTheDocument();
});
