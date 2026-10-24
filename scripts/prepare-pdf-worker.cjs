const fs = require("node:fs"),
  path = require("node:path");
const packagePath = require.resolve("pdfjs-dist/package.json");
const root = path.dirname(packagePath),
  version = JSON.parse(fs.readFileSync(packagePath, "utf8")).version;
const out = path.join(__dirname, "../public/theater-pdf");
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(
  path.join(root, "build/pdf.worker.min.mjs"),
  path.join(out, `pdf.worker.${version}.min.mjs`),
);
fs.copyFileSync(
  path.join(root, "LICENSE"),
  path.join(out, "PDFJS-LICENSE.txt"),
);
console.log(`Prepared local PDF preview worker ${version}.`);
