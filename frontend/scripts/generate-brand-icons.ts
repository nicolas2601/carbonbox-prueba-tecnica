import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = await readFile(fileURLToPath(new URL("../assets/logo-mark.svg", import.meta.url)), "utf8");
const sprite = source.replace("<svg ", '<svg id="carbonbox-mark" ');
await writeFile(fileURLToPath(new URL("../public/favicon.svg", import.meta.url)), sprite);
await sharp(Buffer.from(source)).resize(180, 180).png().toFile(fileURLToPath(new URL("../public/apple-touch-icon.png", import.meta.url)));

const ICON_SIZE = 32;
const ICO_HEADER_SIZE = 22;
const png = await sharp(Buffer.from(source)).resize(ICON_SIZE, ICON_SIZE).png().toBuffer();
const header = Buffer.alloc(ICO_HEADER_SIZE);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = ICON_SIZE;
header[7] = ICON_SIZE;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(ICO_HEADER_SIZE, 18);
await writeFile(fileURLToPath(new URL("../src/app/favicon.ico", import.meta.url)), Buffer.concat([header, png]));
