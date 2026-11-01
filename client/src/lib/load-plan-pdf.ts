import { jsPDF } from "jspdf";
import type { Pallet } from "@/types/load-planning";
import type { AircraftConfig, GridConfig } from "@/utils/aircraft-config";

const NAVY = [15, 25, 50] as const;
const ORANGE = [249, 115, 22] as const;
const WHITE = [255, 255, 255] as const;
const GREY = [200, 205, 215] as const;
const TEXT = [20, 30, 50] as const;
const MUTED = [110, 120, 135] as const;

export interface LoadPlanPdfInput {
  aircraftLabel: string;
  config: AircraftConfig;
  grid: Pick<GridConfig, "rows" | "cols">;
  pallets: Pallet[];
  /** Display unit label for all weights in the document. */
  unit: string;
  /** Converts a native engine weight to the display unit. */
  toDisplay: (w: number) => number;
  totalWeight: number;
  balanceCG: number;
  balanceStatus: string;
  warnings: string[];
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

/** Vector-drawn load plan (no screenshots, so it works offline and without CORS). */
export function downloadLoadPlanPdf(input: LoadPlanPdfInput): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, w, 22, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(0, 22, w, 2, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${input.aircraftLabel} — Load plan`, 12, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleString("en-AU")} · Planning aid only — not for operational use`, 12, 17);

  // Summary row
  doc.setTextColor(...TEXT);
  doc.setFontSize(9);
  const summary = [
    ["Total load", `${fmt(input.toDisplay(input.totalWeight))} ${input.unit}`],
    ["Max payload", `${fmt(input.toDisplay(input.config.maxPayload))} ${input.unit}`],
    ["Positions", `${input.pallets.filter((p) => p.location === "cargo").length} of ${input.config.positions}`],
    ["Centre of gravity", `${input.balanceCG.toFixed(2)}° (${input.balanceStatus})`],
  ];
  const boxW = (w - 24 - 9) / 4;
  summary.forEach(([label, value], i) => {
    const x = 12 + i * (boxW + 3);
    doc.setDrawColor(...GREY);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, 29, boxW, 13, 1.5, 1.5, "FD");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x + 3, 34);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT);
    doc.text(value, x + 3, 39.5);
    doc.setFont("helvetica", "normal");
  });

  // Bay diagram
  const bayX = 12;
  const bayY = 50;
  const bayW = w - 24;
  const cellW = bayW / input.grid.cols;
  const cellH = input.grid.rows === 1 ? 26 : 20;
  const bayH = cellH * input.grid.rows;
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("NOSE (FWD)", bayX, bayY - 2);
  doc.text("TAIL (AFT)", bayX + bayW, bayY - 2, { align: "right" });

  for (let r = 0; r < input.grid.rows; r++) {
    for (let c = 0; c < input.grid.cols; c++) {
      const label = `P${r * input.grid.cols + c + 1}`;
      const pallet = input.pallets.find((p) => p.location === "cargo" && p.positionLabel === label);
      const x = bayX + c * cellW;
      const y = bayY + r * cellH;
      if (pallet) {
        if (pallet.cargoType === "DG") doc.setFillColor(254, 226, 226);
        else doc.setFillColor(255, 237, 213);
      } else {
        doc.setFillColor(250, 250, 250);
      }
      doc.setDrawColor(...GREY);
      doc.rect(x, y, cellW, cellH, "FD");
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(label, x + 1.5, y + 4);
      if (pallet) {
        doc.setTextColor(...TEXT);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(pallet.weight !== null ? `${fmt(input.toDisplay(pallet.weight))} ${input.unit}` : "—", x + 1.5, y + 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.text(`${pallet.cargoType === "DG" ? `DG cl.${pallet.dgClass ?? "?"}` : "Cargo"}`, x + 1.5, y + 14.5);
      }
    }
  }

  // Legend
  let y = bayY + bayH + 6;
  doc.setFontSize(7);
  doc.setFillColor(255, 237, 213);
  doc.rect(bayX, y - 3, 4, 3, "F");
  doc.setTextColor(...TEXT);
  doc.text("General cargo", bayX + 6, y);
  doc.setFillColor(254, 226, 226);
  doc.rect(bayX + 36, y - 3, 4, 3, "F");
  doc.text("Dangerous goods", bayX + 42, y);

  // Manifest table
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Manifest", bayX, y);
  y += 4;
  const cols: Array<[string, number]> = [["Pos", 14], ["Weight", 30], ["Type", 22], ["Category", 40], ["DG class", 24]];
  doc.setFillColor(...NAVY);
  doc.rect(bayX, y, bayW, 6, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(7.5);
  let cx = bayX + 2;
  cols.forEach(([label, cw]) => {
    doc.text(label, cx, y + 4);
    cx += cw;
  });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT);
  const rows = input.pallets
    .filter((p) => p.location === "cargo")
    .sort((a, b) => Number(a.positionLabel?.slice(1) ?? 0) - Number(b.positionLabel?.slice(1) ?? 0));
  if (rows.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("No cargo loaded.", bayX + 2, y + 4);
    y += 6;
  }
  rows.forEach((p, i) => {
    if (y > h - 24) {
      doc.addPage();
      y = 14;
    }
    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(bayX, y, bayW, 6, "F");
    }
    cx = bayX + 2;
    const cells = [
      p.positionLabel ?? "—",
      p.weight !== null ? `${fmt(input.toDisplay(p.weight))} ${input.unit}` : "—",
      p.cargoType === "DG" ? "Dangerous goods" : "General",
      p.cargoCategory ?? "—",
      p.cargoType === "DG" ? (p.dgClass ?? "—") : "—",
    ];
    cells.forEach((c, j) => {
      doc.text(c, cx, y + 4);
      cx += cols[j][1];
    });
    y += 6;
  });

  if (input.warnings.length > 0) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28);
    doc.text("Warnings", bayX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    input.warnings.forEach((wn) => {
      y += 5;
      doc.text(`• ${wn}`, bayX + 2, y);
    });
  }

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text("UNCLASSIFIED — FOR TRAINING PURPOSES ONLY", 12, h - 5);

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${input.aircraftLabel.replace(/[^A-Za-z0-9]+/g, "-")}-load-plan-${stamp}.pdf`);
}
