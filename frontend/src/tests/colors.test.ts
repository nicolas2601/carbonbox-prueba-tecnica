import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
type Color = { red: number; green: number; blue: number; alpha: number };
type Pair = [string, Color, Color];
function color(token: string): Color {
  const value = css.match(new RegExp(`--${token}:\\s*(#[\\da-f]{6}|rgba?\\([^;]+\\))`, "i"))?.[1];
  if (!value) throw new Error(`Missing color token ${token}`);
  if (value.startsWith("#")) return { red: parseInt(value.slice(1, 3), 16) / 255,
    green: parseInt(value.slice(3, 5), 16) / 255, blue: parseInt(value.slice(5, 7), 16) / 255, alpha: 1 };
  const [red, green, blue, alpha = "1"] = value.match(/[\d.]+/g) ?? [];
  return { red: Number(red) / 255, green: Number(green) / 255, blue: Number(blue) / 255, alpha: Number(alpha) };
}
function blend(first: Color, second: Color, ratio: number): Color {
  return { red: first.red * ratio + second.red * (1 - ratio), green: first.green * ratio + second.green * (1 - ratio),
    blue: first.blue * ratio + second.blue * (1 - ratio), alpha: 1 };
}
function luminance(value: Color): number {
  const linear = [value.red, value.green, value.blue].map(channel =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(foreground: Color, background: Color): number {
  const rendered = foreground.alpha < 1 ? blend(foreground, background, foreground.alpha) : foreground;
  const light = Math.max(luminance(rendered), luminance(background));
  const dark = Math.min(luminance(rendered), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}
const surfaces = ["bg", "canvas-bottom", "surface", "surface-solid", "table-surface"];
const textPairs: Pair[] = [
  ...surfaces.flatMap(surface => (surface === "canvas-bottom" ? ["text", "text-muted"] : ["text", "text-muted", "accent-strong"]).map(text =>
    [`${text} on ${surface}`, color(text), color(surface)] as Pair)),
  ...["graphite", "graphite-2"].flatMap(surface => ["on-graphite", "on-graphite-muted"].map(text =>
    [`${text} on ${surface}`, color(text), color(surface)] as Pair)),
  ...["pending", "processing", "completed", "failed"].flatMap(status => [status, "text", "text-muted"].map(text =>
    [`${text} on ${status}-bg`, color(text), color(`${status}-bg`)] as Pair)),
  ...Array.from({ length: 11 }, (_, step) => [
    `accent ink on gradient at ${step * 10}%`, color("accent-ink"), blend(color("accent"), color("accent-2"), step / 10),
  ] as Pair),
  ["active navigation label", color("text"), blend(color("accent"), color("surface-solid"), 0.12)],
  ["dropzone label", color("accent-strong"), blend(color("accent"), color("surface"), 0.1)],
];
it("Keeps canvas links in ink, reserving accent strong for surfaces and decoration", () => {
  const pages = readFileSync("src/styles/pages.css", "utf8");
  expect(pages).toContain(".back-link, .canvas-link { color: var(--text);");
});
it.each(textPairs)("Text contrast >= 4.5:1: %s", (label, foreground, background) => {
  expect(contrast(foreground, background), label).toBeGreaterThanOrEqual(4.5);
});
const graphicPairs: Pair[] = [
  ...surfaces.map(surface => [`essential stroke on ${surface}`, color("accent-strong"), color(surface)] as Pair),
  ...["accent", "accent-2", "teal"].map(token => [`${token} gauge/status on graphite`, color(token), color("graphite")] as Pair),
  ...["completed", "processing", "failed"].map(token => [`${token} status bar`, color(token), color("surface")] as Pair),
];
it.each(graphicPairs)("Essential graphics contrast >= 3:1: %s", (label, foreground, background) => {
  expect(contrast(foreground, background), label).toBeGreaterThanOrEqual(3);
});
