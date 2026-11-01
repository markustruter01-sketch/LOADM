import jsPDF from "jspdf";

/** Simple two-column table of a submitted form. */
export function downloadSubmissionPdf(opts: { title: string; submittedBy?: string; submittedAt: Date; rows: Array<[string, string]> }): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const left = 14;
  const labelW = 62;
  const valueW = w - left * 2 - labelW - 4;

  doc.setFillColor(15, 25, 50);
  doc.rect(0, 0, w, 24, "F");
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 24, w, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(opts.title, left, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const meta = [`Submitted ${opts.submittedAt.toLocaleString("en-AU")}`, opts.submittedBy ? `by ${opts.submittedBy}` : ""].filter(Boolean).join(" ");
  doc.text(meta, left, 19);

  let y = 34;
  doc.setFontSize(9);
  opts.rows.forEach(([label, value], i) => {
    const lines = doc.splitTextToSize(value, valueW) as string[];
    const rowH = Math.max(7, lines.length * 4.5 + 2.5);
    if (y + rowH > h - 16) {
      doc.addPage();
      y = 16;
    }
    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(left, y, w - left * 2, rowH, "F");
    }
    doc.setTextColor(80, 95, 115);
    doc.setFont("helvetica", "bold");
    doc.text(label, left + 2, y + 4.8);
    doc.setTextColor(20, 30, 50);
    doc.setFont("helvetica", "normal");
    doc.text(lines, left + labelW, y + 4.8);
    y += rowH;
  });

  doc.setFontSize(6.5);
  doc.setTextColor(110, 120, 135);
  doc.text("UNCLASSIFIED — FOR TRAINING PURPOSES ONLY", left, h - 6);
  doc.save(`${opts.title.replace(/[^A-Za-z0-9]+/g, "-")}-${opts.submittedAt.toISOString().slice(0, 10)}.pdf`);
}
