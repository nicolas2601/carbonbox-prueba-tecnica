import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
function luminance(token: string): number {
  const hex = css.match(new RegExp(`--${token}: #([a-f0-9]{6})`, "i"))?.[1];
  if (!hex) throw new Error(`Missing color token ${token}`);
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
it.each([["ink", "paper"], ["ink-muted", "paper"], ["ink-muted", "surface"], ["accent-ink", "accent"],
  ["pending", "pending-bg"], ["processing", "processing-bg"], ["completed", "completed-bg"], ["failed", "failed-bg"],
  ["failed", "paper"], ["ink", "pending-bg"]])("Keeps %s on %s above WCAG AA text contrast", (foreground, background) => {
  const light = luminance(foreground), dark = luminance(background);
  expect((Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05)).toBeGreaterThanOrEqual(4.5);
});
