import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const root = join(process.cwd(), "src");
const css = readFileSync(join(root, "app/globals.css"), "utf8");
const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
const colors = ["paper", "surface", "ink", "ink-muted", "line", "accent", "accent-ink",
  "pending", "pending-bg", "processing", "processing-bg", "completed", "completed-bg", "failed", "failed-bg"];

it.each(colors)("Defines semantic token --%s once", token => {
  expect(css.match(new RegExp(`--${token}\\s*:`, "g"))).toHaveLength(1);
  expect(css).toContain(`--color-${token}: var(--${token})`);
});
it("Loads the specified self-hosted fonts with swap", () => {
  for (const name of ["Fraunces", "Instrument_Sans", "JetBrains_Mono"]) expect(layout).toContain(`${name}(`);
  expect(layout.match(/display: "swap"/g)).toHaveLength(3);
});
it("Defines the visible keyboard focus ring", () => {
  expect(css).toContain(":focus-visible");
  expect(css).toContain("outline: 2px solid var(--accent)");
  expect(css).toContain("outline-offset: 2px");
});
function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(tsx?|css)$/.test(file) && !file.includes(".test.") ? [file] : [];
  });
}
it("Uses no hexadecimal colors outside globals.css and no all-property transitions", () => {
  for (const file of sourceFiles(root)) {
    const content = readFileSync(file, "utf8");
    if (!file.endsWith("globals.css")) expect(content, file).not.toMatch(/#[\da-f]{3,8}\b/i);
    expect(content, file).not.toMatch(/transition-all|transition\s*:\s*[^;}]*\ball\b/);
  }
});
