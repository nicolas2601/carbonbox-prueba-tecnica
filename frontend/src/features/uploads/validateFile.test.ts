import { expect, it } from "vitest";
import { maxUploadMb, validateFile } from "./validateFile";

const MB = 1024 * 1024;
it.each(["file.csv", "DATA.CSV", " data.csv "])("Accepts %s", name => {
  expect(validateFile({ name, size: 1 }, 10)).toBeNull();
});
it.each(["notes.txt", "file.csv.exe", "csv"])("Rejects extension %s", name => {
  expect(validateFile({ name, size: 1 }, 10)).toBe("Only .csv files are accepted. Choose a file ending in .csv.");
});
it("Rejects empty files before transfer", () => {
  expect(validateFile({ name: "empty.csv", size: 0 }, 10)).toContain("empty");
});
it("Accepts the exact byte boundary but rejects one excess byte", () => {
  expect(validateFile({ name: "data.csv", size: 2 * MB }, 2)).toBeNull();
  expect(validateFile({ name: "data.csv", size: 2 * MB + 1 }, 2)).toContain("2 MB");
});
it.each([[undefined, 10], ["abc", 10], ["0", 10], ["-2", 10], ["Infinity", 10], ["2", 2]])(
  "Uses a safe size hint from %s", (value, expected) => expect(maxUploadMb(value)).toBe(expected),
);
