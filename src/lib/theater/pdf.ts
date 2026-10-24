import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFImage,
  type PDFFont,
} from "pdf-lib";
import companyDefault from "../../data/theater/quotation-company.json";
import type { QuoteSnapshot } from "./types";
import { formatLength } from "./measurements";
import {
  localQuotationImage,
  quotationLogo,
  quotationProduct,
} from "./quotation-assets";

export const QUOTATION_TEMPLATE_VERSION = "v2-illustrated";
const C = {
  ink: rgb(0.075, 0.15, 0.2),
  muted: rgb(0.32, 0.39, 0.43),
  gold: rgb(0.56, 0.37, 0.14),
  line: rgb(0.83, 0.87, 0.88),
  pale: rgb(0.95, 0.97, 0.975),
  white: rgb(1, 1, 1),
};
const clean = (s: string) =>
  String(s)
    .normalize("NFKD")
    .replace(/[–—−]/g, "-")
    .replace(/×/g, "x")
    .replace(/₹/g, "INR ")
    .replace(/[^\x20-\x7E\n]/g, "");
const money = (p: number) =>
  (p / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const date = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

export async function quotationPdf(q: QuoteSnapshot): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica),
    bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const company = q.company ?? companyDefault;
  const W = 595.28,
    H = 841.89,
    L = 36,
    R = W - 36,
    B = 64,
    width = R - L;
  let page = doc.addPage([W, H]),
    y = H - 38;
  const imageCache = new Map<string, PDFImage | null>();
  const logoBytes = await quotationLogo();
  const logo = logoBytes
    ? await doc.embedPng(logoBytes).catch(() => null)
    : null;
  const draw = (
    text: string,
    x: number,
    at: number,
    size = 9,
    font: PDFFont = regular,
    color = C.ink,
  ) => page.drawText(clean(text), { x, y: at, size, font, color });
  const right = (
    text: string,
    x: number,
    at: number,
    size = 9,
    font: PDFFont = regular,
    color = C.ink,
  ) => {
    const s = clean(text);
    draw(s, x - font.widthOfTextAtSize(s, size), at, size, font, color);
  };
  function wrap(
    text: string,
    font: PDFFont,
    size: number,
    w: number,
  ): string[] {
    const result: string[] = [];
    for (const para of clean(text).split("\n")) {
      let line = "";
      for (const raw of para.split(/\s+/).filter(Boolean)) {
        let word = raw;
        if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > w) {
          result.push(line);
          line = "";
        }
        while (font.widthOfTextAtSize(word, size) > w) {
          let n = 1;
          while (
            n < word.length &&
            font.widthOfTextAtSize(word.slice(0, n + 1), size) <= w
          )
            n++;
          result.push(word.slice(0, n));
          word = word.slice(n);
        }
        line += (line ? " " : "") + word;
      }
      result.push(line);
    }
    return result;
  }
  function lines(
    text: string,
    x: number,
    at: number,
    w: number,
    size = 9,
    font: PDFFont = regular,
    color = C.ink,
    max = Infinity,
  ) {
    const all = wrap(text, font, size, w),
      shown = all.slice(0, max);
    if (all.length > max && shown.length) {
      let last = shown[shown.length - 1];
      while (font.widthOfTextAtSize(last + "...", size) > w)
        last = last.slice(0, -1);
      shown[shown.length - 1] = last + "...";
    }
    shown.forEach((s, i) =>
      draw(s, x, at - i * size * 1.45, size, font, color),
    );
    return shown.length * size * 1.45;
  }
  function rule(at: number) {
    page.drawLine({
      start: { x: L, y: at },
      end: { x: R, y: at },
      thickness: 0.6,
      color: C.line,
    });
  }
  function header(first = false) {
    if (first && logo) {
      const scale = Math.min(105 / logo.width, 43 / logo.height);
      page.drawImage(logo, {
        x: L,
        y: H - 73,
        width: logo.width * scale,
        height: logo.height * scale,
      });
    } else draw(company.name.toUpperCase(), L, H - 51, 20, bold);
    right(
      first
        ? q.calculation.complete
          ? "HOME THEATRE QUOTATION"
          : "HOME THEATRE BUDGET ESTIMATE"
        : "YOUR CINEMA PROPOSAL",
      R,
      H - 43,
      8,
      bold,
      C.gold,
    );
    right(q.number, R, H - 60, 9, bold);
    if (first) {
      draw(company.tagline, L, H - 88, 6.6, bold, C.muted);
      right(
        `Issued ${date(q.createdAt)}   |   Valid until ${date(q.validUntil)}`,
        R,
        H - 78,
        7.5,
        regular,
        C.muted,
      );
    }
    rule(H - (first ? 103 : 88));
    y = H - (first ? 123 : 108);
  }
  function newPage() {
    page = doc.addPage([W, H]);
    header();
  }
  function ensure(h: number) {
    if (y - h < B) newPage();
  }
  function section(title: string) {
    ensure(42);
    y -= 12;
    draw(title, L, y, 12, bold);
    y -= 23;
  }
  function paragraph(text: string, size = 9, color = C.muted) {
    for (const line of wrap(text, regular, size, width)) {
      ensure(size * 1.5);
      draw(line, L, y, size, regular, color);
      y -= size * 1.5;
    }
  }
  header(true);
  draw("PREPARED FOR", L, y, 7, bold, C.gold);
  draw("PREPARED BY", L + 315, y, 7, bold, C.gold);
  y -= 17;
  const clientHeight = lines(q.state.customer.name, L, y, 285, 15, bold);
  const authorHeight = lines(
    q.createdBy?.name ?? company.name,
    L + 315,
    y,
    205,
    10,
    bold,
  );
  const client = [
    q.state.customer.project,
    q.state.customer.address,
    [q.state.customer.phone, q.state.customer.email]
      .filter(Boolean)
      .join(" | "),
  ]
    .filter(Boolean)
    .join("\n");
  const clientBody = lines(
    client,
    L,
    y - clientHeight - 5,
    285,
    8.5,
    regular,
    C.muted,
  );
  const authorBody = lines(
    [
      q.createdBy?.email ?? company.email,
      company.phone,
      company.address,
      `GSTIN ${company.gstin}`,
    ].join("\n"),
    L + 315,
    y - authorHeight - 5,
    205,
    8,
    regular,
    C.muted,
  );
  y -= Math.max(clientHeight + clientBody, authorHeight + authorBody) + 20;
  const d = q.state.design;
  const specs = [
    `${formatLength(d.width)} x ${formatLength(d.depth)}`,
    `${d.rows} rows / ${d.rows * d.seats} seats`,
    `${d.diagonal}" ${d.aspect}`,
    `${d.audio} sound`,
  ];
  ensure(57);
  page.drawRectangle({ x: L, y: y - 43, width, height: 45, color: C.pale });
  specs.forEach((s, i) => {
    const x = L + 12 + i * (width / 4);
    draw(
      ["ROOM SIZE", "SEATING", "SCREEN", "AUDIO"][i],
      x,
      y - 1,
      6.5,
      bold,
      C.muted,
    );
    draw(s, x, y - 20, 9, bold);
  });
  y -= 63;
  let preview: PDFImage | null = null;
  if (q.state.preview) {
    try {
      preview = q.state.preview.startsWith("data:image/png")
        ? await doc.embedPng(q.state.preview)
        : await doc.embedJpg(q.state.preview);
    } catch {
      /* Preview decoding never changes the saved financial values. */
    }
  }
  ensure(147);
  const cardTop = y;
  if (preview) {
    const boxW = 292,
      boxH = 137,
      scale = Math.min(boxW / preview.width, boxH / preview.height);
    page.drawRectangle({
      x: L,
      y: y - boxH,
      width: boxW,
      height: boxH,
      color: C.pale,
    });
    page.drawImage(preview, {
      x: L + (boxW - preview.width * scale) / 2,
      y: y - boxH + (boxH - preview.height * scale) / 2,
      width: preview.width * scale,
      height: preview.height * scale,
    });
  } else {
    draw("A cinema designed around your room.", L, y - 16, 12, bold);
    lines(
      "Your selected equipment is pictured in the schedule below. Model names, quantities and prices are preserved with this quotation revision.",
      L,
      y - 37,
      275,
      9,
      regular,
      C.muted,
    );
  }
  const cx = L + 310,
    cw = width - 310;
  page.drawRectangle({
    x: cx,
    y: cardTop - 137,
    width: cw,
    height: 137,
    color: C.ink,
  });
  draw(
    q.calculation.complete ? "PROJECT TOTAL / INR" : "KNOWN SUBTOTAL / INR",
    cx + 14,
    cardTop - 22,
    7,
    bold,
    C.white,
  );
  const amount = money(q.calculation.totalPaise),
    amountSize = Math.min(22, (cw - 28) / bold.widthOfTextAtSize(amount, 1));
  draw(amount, cx + 14, cardTop - 56, amountSize, bold, C.white);
  lines(
    q.calculation.complete
      ? "Includes the GST shown in the price breakdown."
      : "Incomplete estimate. Missing and unconfirmed items are excluded.",
    cx + 14,
    cardTop - 79,
    cw - 28,
    8,
    regular,
    C.white,
  );
  draw(
    `Revision ${q.revision}  |  ${q.state.validityDays}-day validity`,
    cx + 14,
    cardTop - 120,
    7,
    regular,
    C.white,
  );
  y = cardTop - 155;
  section("Equipment & project work");
  const tableHeader = () => {
    page.drawRectangle({ x: L, y: y - 23, width, height: 25, color: C.ink });
    draw("MODEL / DESCRIPTION", L + 72, y - 14, 7, bold, C.white);
    right("QTY", L + 354, y - 14, 7, bold, C.white);
    right("LIST / UNIT", L + 431, y - 14, 7, bold, C.white);
    right("LINE TOTAL", R - 8, y - 14, 7, bold, C.white);
    y -= 34;
  };
  tableHeader();
  for (let index = 0; index < q.calculation.lines.length; index++) {
    const line = q.calculation.lines[index],
      p = quotationProduct(line, q.products),
      summary =
        p?.description ?? "Installation / project work supplied by Epix Infra.",
      title = line.model ? `${line.brand} ${line.model}` : line.label;
    const detailWidth = 260,
      titleHeight = wrap(title, bold, 9.2, detailWidth).length * 13.34,
      summaryLines = wrap(summary, regular, 7.7, detailWidth).slice(
        0,
        3,
      ).length;
    const rowH = Math.max(
      100,
      titleHeight +
        summaryLines * 11.2 +
        52 +
        (line.pending.length ? 15 : 0) +
        (line.spare ? 11 : 0),
    );
    if (y - rowH < B) {
      newPage();
      section("Equipment & project work / continued");
      tableHeader();
    }
    const top = y;
    draw(String(index + 1).padStart(2, "0"), L, top - 9, 7, bold, C.gold);
    if (p) {
      let img = imageCache.get(p.id);
      if (img === undefined) {
        const bytes = await localQuotationImage(p);
        img = bytes ? await doc.embedJpg(bytes).catch(() => null) : null;
        imageCache.set(p.id, img);
      }
      if (img) {
        const scale = Math.min(57 / img.width, 66 / img.height);
        page.drawImage(img, {
          x: L + 6 + (57 - img.width * scale) / 2,
          y: top - 80 + (66 - img.height * scale) / 2,
          width: img.width * scale,
          height: img.height * scale,
        });
      } else
        lines("Photo\nunavailable", L + 8, top - 36, 53, 7, regular, C.muted);
    } else {
      page.drawRectangle({
        x: L + 7,
        y: top - 69,
        width: 51,
        height: 49,
        color: C.pale,
      });
      draw("EPIX", L + 19, top - 44, 8, bold, C.muted);
      draw("PROJECT WORK", L + 4, top - 84, 5.8, bold, C.muted);
    }
    let dy = top - 10;
    dy -= lines(title, L + 72, dy, detailWidth, 9.2, bold);
    dy -=
      lines(
        line.model
          ? `${line.label}${line.finish ? ` | ${line.finish}` : ""}`
          : "Project scope",
        L + 72,
        dy - 3,
        detailWidth,
        7.5,
        regular,
        C.gold,
      ) + 7;
    dy -= lines(summary, L + 72, dy, detailWidth, 7.7, regular, C.muted, 3) + 4;
    const tax =
      line.price.taxBasis === "inclusive"
        ? "List rate includes GST"
        : line.price.taxBasis === "exclusive"
          ? "List rate excludes GST"
          : "Tax basis to confirm";
    draw(
      `${tax}${line.price.gstRate !== null ? ` (${line.price.gstRate}%)` : ""}`,
      L + 72,
      dy,
      7,
      regular,
      C.muted,
    );
    dy -= 11;
    if (line.spare) {
      draw(
        `${line.spare} spare physical unit(s) included in these packs`,
        L + 72,
        dy,
        7,
        regular,
        C.muted,
      );
      dy -= 11;
    }
    if (line.pending.length)
      lines(
        `To confirm: ${line.pending.join(", ")}`,
        L + 72,
        dy,
        detailWidth,
        7.3,
        bold,
        C.gold,
      );
    right(String(line.quantity), L + 354, top - 12, 9, bold);
    right(line.unit, L + 354, top - 26, 6.8, regular, C.muted);
    right(
      line.price.amountPaise === null
        ? "On request"
        : money(line.price.amountPaise),
      L + 431,
      top - 12,
      8,
    );
    right(
      line.totalPaise === null ? "To confirm" : money(line.totalPaise),
      R - 8,
      top - 12,
      8.5,
      bold,
    );
    if (line.totalPaise !== null) {
      right(
        `GST ${money(line.taxPaise ?? 0)}`,
        R - 8,
        top - 27,
        6.4,
        regular,
        C.muted,
      );
      right(
        `Disc. ${money(line.discountPaise)}`,
        R - 8,
        top - 39,
        6.4,
        regular,
        C.muted,
      );
    }
    y = top - rowH;
    rule(y + 7);
  }
  if (!q.calculation.lines.length)
    paragraph(
      "Equipment selection has not been completed. This document is an incomplete budget estimate.",
    );
  ensure(159);
  y -= 16;
  const totalX = L + 292;
  const totals = [
    ["Subtotal before discount & GST", q.calculation.subtotalPaise],
    [`Discount (${q.state.discountPercent}%)`, -q.calculation.discountPaise],
    ["GST", q.calculation.taxPaise],
  ] as const;
  for (const [label, value] of totals) {
    draw(label, totalX, y, 8, regular, C.muted);
    right(`${value < 0 ? "-" : ""}${money(Math.abs(value))}`, R - 8, y, 9);
    y -= 21;
  }
  page.drawRectangle({
    x: totalX - 12,
    y: y - 38,
    width: R - totalX + 12,
    height: 41,
    color: C.ink,
  });
  draw(
    q.calculation.complete ? "TOTAL / INR" : "KNOWN SUBTOTAL / INR",
    totalX,
    y - 5,
    7,
    bold,
    C.white,
  );
  right(money(q.calculation.totalPaise), R - 8, y - 24, 16, bold, C.white);
  y -= 65;
  paragraph(
    "Amounts in INR. List/unit rates retain the stated tax basis. Line totals include applicable GST after the discount. Quantities are purchasable units, pairs or sets.",
    7.5,
  );
  const pending = [
    ...q.calculation.missing.map((s) => `Missing selection: ${s}`),
    ...q.calculation.issues.map((i) => i.text),
    ...q.calculation.lines
      .filter((l) => l.pending.length)
      .map((l) => `${l.brand} ${l.model || l.label}: ${l.pending.join(", ")}`),
  ];
  if (pending.length) {
    section("Items to confirm before ordering");
    for (const item of pending) paragraph(`- ${item}`, 8.5);
  }
  section("Installation scope & terms");
  paragraph(
    q.state.terms.trim() ||
      "Payment, delivery and installation terms have not been specified. Confirm the project scope with Epix Infra before placing an order.",
  );
  if (q.state.exclusions.trim()) {
    section("Exclusions");
    paragraph(q.state.exclusions);
  }
  ensure(125);
  section("Company & payment reference");
  const bank = company.bank,
    bankText = `Beneficiary: ${bank.beneficiary}\nBank: ${bank.name} | Branch: ${bank.branch}\nAccount: ${bank.account}\nIFSC: ${bank.ifsc}`;
  const bankH = lines(bankText, L, y, 310, 8, regular, C.muted);
  draw(`For ${company.name.toUpperCase()}`, R - 145, y, 9, bold);
  page.drawLine({
    start: { x: R - 145, y: y - 38 },
    end: { x: R, y: y - 38 },
    thickness: 0.6,
    color: C.line,
  });
  draw("Authorised signatory", R - 145, y - 51, 7.5, regular, C.muted);
  y -= Math.max(bankH, 65) + 8;
  const note = wrap(
    "Photos identify the model; finish/accessories may differ. Full specifications: model library. The 3D room is a concept; verify site dimensions and installation. Saved prices are preserved with this revision. Not a tax invoice.",
    regular,
    6,
    width,
  );
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    note.forEach((s, n) =>
      p.drawText(s, {
        x: L,
        y: 55 - n * 8,
        size: 6,
        font: regular,
        color: C.muted,
      }),
    );
    p.drawLine({
      start: { x: L, y: 40 },
      end: { x: R, y: 40 },
      thickness: 0.6,
      color: C.line,
    });
    p.drawText(clean(`${company.name} | ${company.phone}`), {
      x: L,
      y: 26,
      size: 7,
      font: regular,
      color: C.muted,
    });
    const counter = `${i + 1} / ${pages.length}`;
    p.drawText(counter, {
      x: R - regular.widthOfTextAtSize(counter, 7),
      y: 26,
      size: 7,
      font: regular,
      color: C.muted,
    });
  });
  doc.setTitle(`${q.number} - ${company.name}`);
  doc.setAuthor(company.name);
  doc.setSubject("Home theatre equipment and project quotation");
  return doc.save();
}
