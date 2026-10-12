import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const root = join(process.cwd(), "src");
const css = readFileSync(join(root, "app/globals.css"), "utf8");
const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
const tokens = ["bg", "surface", "surface-solid", "line", "text", "text-muted", "accent", "accent-2",
  "accent-strong", "accent-ink", "graphite", "graphite-2", "on-graphite", "on-graphite-muted", "teal",
  "pending", "pending-bg", "processing", "processing-bg", "completed", "completed-bg", "failed", "failed-bg"];

it.each(tokens)("Defines Carbon Day token --%s once and exposes it to Tailwind", token => {
  expect(css.match(new RegExp(`--${token}\\s*:`, "g"))).toHaveLength(1);
  expect(css).toContain(`--color-${token}: var(--${token})`);
});
it("Keeps utility aliases for existing page styles", () => {
  expect(css).toContain("--paper: var(--bg)");
  expect(css).toContain("--ink: var(--text)");
  expect(css).toContain("--ink-muted: var(--text-muted)");
});
it("Uses solid tinted surfaces without pure white, pure black or card blur", () => {
  expect(css).toContain("--surface: #FAFBFC");
  expect(css).toContain("--surface-solid: #F5F7F8");
  expect(css).toContain("--table-surface: #FBFCFD");
  expect(css).not.toMatch(/#(?:FFFFFF|000000)\b/i);
  expect(css).not.toMatch(/backdrop-filter/);
});
it("Loads Sora, Geist and Geist Mono with swap", () => {
  for (const name of ["Sora", "Geist", "Geist_Mono"]) expect(layout).toContain(`${name}(`);
  expect(layout.match(/display: "swap"/g)).toHaveLength(3);
  expect(layout).toContain('variable: "--font-sora"');
  expect(layout).toContain('variable: "--font-geist"');
  expect(layout).toContain('variable: "--font-geist-mono"');
});
it("Defines the visible keyboard focus ring", () => {
  expect(css).toContain(":focus-visible");
  expect(css).toContain("outline: 2px solid var(--accent-strong)");
  expect(css).toContain("outline-offset: 2px");
  expect(readFileSync(join(root, "styles/dashboard.css"), "utf8")).toContain(".dashboard-rail .state-card :focus-visible { outline-color: var(--accent-strong);");
});
it("Keeps the focused skip link above fixed and sticky navigation", () => {
  const shell = readFileSync(join(root, "styles/shell.css"), "utf8");
  const skipLayer = Number(css.match(/\.skip-link\s*\{[^}]*z-index:\s*(\d+)/)?.[1]);
  for (const selector of ["desktop-sidebar", "mobile-topbar"]) {
    const navigationLayer = Number(shell.match(new RegExp(`\\.${selector}\\s*\\{[^}]*z-index:\\s*(\\d+)`))?.[1]);
    expect(skipLayer).toBeGreaterThan(navigationLayer);
  }
});
it("Reveals only the activity area through a transform-only SVG clip", () => {
  const chart = readFileSync(join(root, "features/uploads/dashboard/Charts.tsx"), "utf8");
  const styles = readFileSync(join(root, "styles/dashboard.css"), "utf8");
  expect(chart).toContain('className="area-reveal-mask"');
  expect(styles).toContain(".area-reveal-mask { animation: area-reveal 700ms");
  expect(styles).toContain(".area-reveal-mask, .gauge-sweep { animation: none;");
});
it("Keeps pointer press deliberate and release snappy without animating keyboard actions", () => {
  expect(css).toContain("--release: 100ms");
  expect(css).toContain("transition-duration: var(--feedback), var(--feedback)");
  expect(css).toContain(":root:has(:focus-visible) .enter { animation: none");
});
function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(tsx?|css)$/.test(file) && !file.includes(".test.") ? [file] : [];
  });
}
it("Uses no hexadecimal colors or font family names outside the stylesheet and font loader", () => {
  for (const file of sourceFiles(root)) {
    const content = readFileSync(file, "utf8");
    if (!file.endsWith("globals.css")) expect(content, file).not.toMatch(/#[\da-f]{3,8}\b/i);
    if (!file.endsWith("globals.css") && !file.endsWith("layout.tsx")) {
      const withoutFontTokens = content.replace(/font-family\s*:\s*var\(--font-(?:sora|geist|geist-mono)\)(?:,\s*(?:sans-serif|monospace))?\s*;/gi, "");
      expect(withoutFontTokens, file).not.toMatch(/\b(?:Sora|Geist(?:_Mono)?|Fraunces|Instrument_Sans|JetBrains_Mono)\b|font-family\s*:/i);
    }
    expect(content, file).not.toMatch(/transition-all|transition\s*:\s*[^;}]*\ball\b/);
  }
});
