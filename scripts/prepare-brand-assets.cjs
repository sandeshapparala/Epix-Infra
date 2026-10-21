// Deterministic web exports of the supplied, approved artwork. No letter redraws.
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));
const root = path.resolve(__dirname, "..");

async function save(relative, bytes) {
  const file = path.join(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, bytes);
}

async function main() {
  const wordmark = await fs.readFile(path.join(root, "branding/source/epix-infra-wordmark.jpg"));
  const emblem = await fs.readFile(path.join(root, "branding/source/epix-infra-emblem.jpg"));
  const crop = { left: 84, top: 184, width: 1390, height: 570 };
  const compact = await sharp(wordmark).extract(crop).png().toBuffer();
  const full = await sharp(wordmark).extract({ ...crop, height: 644 }).png().toBuffer();
  const header = await sharp(compact).resize({ width: 480 }).extend({ top: 7, bottom: 7, left: 8, right: 8, background: "white" }).png({ palette: true, quality: 95, effort: 8 }).toBuffer();
  const fullPng = await sharp(full).resize({ width: 1390 }).png().toBuffer();
  await save("public/brand/epix-infra-logo.png", fullPng);
  await save("public/brand/epix-infra-logo.webp", await sharp(full).webp({ quality: 92 }).toBuffer());
  await save("public/brand/epix-infra-wordmark.png", header);
  await save("public/brand/epix-infra-emblem.png", await sharp(emblem).resize(512, 512).png().toBuffer());
  // A single original E remains readable at 16/32 px; the full seal is for larger icons.
  const symbol = await sharp(wordmark).extract({ left: 86, top: 188, width: 346, height: 438 }).resize({ width: 338, height: 426, fit: "inside" }).extend({ top: 43, bottom: 43, left: 87, right: 87, background: "white" }).resize(512, 512, { fit: "contain", background: "white" }).png().toBuffer();
  await save("public/brand/epix-infra-symbol.png", symbol);
  for (const file of ["public/logo.png", "src/Images/logo.png", "src/Images/logo2.png", "src/Images/logo_white.png"]) await save(file, header);
  for (const file of ["public/logo.jpg", "src/Images/logo.jpg"]) await save(file, await sharp(header).jpeg({ quality: 94, mozjpeg: true }).toBuffer());
  await save("public/epix-wa-icon.png", await sharp(emblem).resize(160, 160).png().toBuffer());
  const entries = await Promise.all([16, 32, 48, 64].map(async size => ({ size, bytes: await sharp(symbol).resize(size, size).ensureAlpha().png().toBuffer() })));
  const icoHeader = Buffer.alloc(6 + entries.length * 16);
  icoHeader.writeUInt16LE(1, 2); icoHeader.writeUInt16LE(entries.length, 4);
  let offset = icoHeader.length;
  entries.forEach(({ size, bytes }, i) => {
    const start = 6 + i * 16;
    icoHeader[start] = size; icoHeader[start + 1] = size;
    icoHeader.writeUInt16LE(1, start + 4); icoHeader.writeUInt16LE(32, start + 6);
    icoHeader.writeUInt32LE(bytes.length, start + 8); icoHeader.writeUInt32LE(offset, start + 12);
    offset += bytes.length;
  });
  await save("src/app/favicon.ico", Buffer.concat([icoHeader, ...entries.map(e => e.bytes)]));
  for (const size of [16, 32]) await save(`public/favicon-${size}x${size}.png`, entries.find(e => e.size === size).bytes);
  for (const size of [192, 512]) await save(`public/brand/icon-${size}.png`, await sharp(emblem).resize(size, size).png().toBuffer());
  await save("public/apple-touch-icon.png", await sharp(emblem).resize(180, 180).png().toBuffer());
  console.log(JSON.stringify({ sourceSha256: crypto.createHash("sha256").update(wordmark).digest("hex"), header: await sharp(header).metadata(), faviconSizes: entries.map(e => e.size) }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
