import type { KpiEvent } from "./kpi-snapshots.service";

/**
 * Escapes PDF special characters in text strings (parentheses and backslashes)
 * to prevent document syntax corruption or parsing errors.
 */
function escapePdfText(text: string): string {
  return text.replace(/[\\()]/g, "\\$&");
}

/**
 * Generates a standard-compliant PDF document for the corporate report export
 * containing metadata, structured styling, and the list of exported records.
 */
export function generatePdfReport(
  id: string,
  now: string,
  requestedBy: string,
  scope: string,
  period: string,
  events: KpiEvent[]
): string {
  const scopeLabel = scope.charAt(0).toUpperCase() + scope.slice(1);
  const streamContentLines = [
    // Header background (navy blue)
    "q",
    "0.08 0.18 0.36 rg",
    "0 760 595.28 81.89 re f",
    "Q",

    // Header text (white)
    "q",
    "1 1 1 rg",
    "BT",
    "/F1 18 Tf",
    "40 795 Td",
    "(COMPLIANCE & AUDIT PLATFORM) Tj",
    "/F1 9 Tf",
    "0 -18 Td",
    "(CORPORATE EXPORT SERVICE - CONFIDENTIAL) Tj",
    "ET",
    "Q",

    // Report Title
    "q",
    "0.1 0.1 0.1 rg",
    "BT",
    "/F1 16 Tf",
    "40 710 Td",
    `(${escapePdfText(scopeLabel.toUpperCase())} REPORT EXPORT) Tj`,
    "ET",
    "Q",

    // Divider
    "q",
    "0.8 0.8 0.8 RG",
    "1 w",
    "40 690 m 555 690 l S",
    "Q",

    // Metadata section
    "q",
    "0.2 0.2 0.2 rg",
    "BT",
    "/F1 11 Tf",
    "40 650 Td",
    "(Export Identifier:) Tj",
    "140 0 Td",
    `(${escapePdfText(id)}) Tj`,
    "-140 -22 Td",
    "(Scope / Domain:) Tj",
    "140 0 Td",
    `(${escapePdfText(scopeLabel)}) Tj`,
    "-140 -22 Td",
    "(Target Period:) Tj",
    "140 0 Td",
    `(${escapePdfText(period)}) Tj`,
    "-140 -22 Td",
    "(Requested By:) Tj",
    "140 0 Td",
    `(${escapePdfText(requestedBy)}) Tj`,
    "-140 -22 Td",
    "(Generation Time:) Tj",
    "140 0 Td",
    `(${escapePdfText(now)}) Tj`,
    "ET",
    "Q",

    // Metadata block background (light gray)
    "q",
    "0.96 0.96 0.98 rg",
    "40 430 515 90 re f",
    "Q",

    // Metadata block content
    "q",
    "0.3 0.3 0.3 rg",
    "BT",
    "/F1 10 Tf",
    "50 500 Td",
    "(Status: COMPLETED) Tj",
    "0 -16 Td",
    "(Format: PDF standard-compliant document) Tj",
    "0 -16 Td",
    "(Classification: INTERNAL USE ONLY) Tj",
    "0 -16 Td",
    "(System Signature: Verified secure audit entry) Tj",
    "ET",
    "Q"
  ];

  // Table Title
  const tableTitleY = 405;
  streamContentLines.push(
    "q",
    "0.1 0.1 0.1 rg",
    "BT",
    "/F1 12 Tf",
    `40 ${tableTitleY} Td`,
    "(EXPORTED RECORDS DATA) Tj",
    "ET",
    "Q"
  );

  // Table header background (navy/slate blue)
  const headerY = tableTitleY - 22;
  streamContentLines.push(
    "q",
    "0.12 0.22 0.42 rg",
    `40 ${headerY} 515 18 re f`,
    "Q"
  );

  // Table header text
  streamContentLines.push(
    "q",
    "1 1 1 rg",
    "BT",
    "/F1 9 Tf",
    `50 ${headerY + 5} Td`,
    "(AREA) Tj",
    "90 0 Td",
    "(EVENT TYPE) Tj",
    "150 0 Td",
    "(RISK LEVEL) Tj",
    "110 0 Td",
    "(COMPLIANCE STATUS) Tj",
    "ET",
    "Q"
  );

  // Table rows or empty message
  if (events.length === 0) {
    const rowY = headerY - 22;
    streamContentLines.push(
      "q",
      "0.5 0.5 0.5 rg",
      "BT",
      "/F1 9 Tf",
      `50 ${rowY + 4} Td`,
      "(No records found matching the requested filters.) Tj",
      "ET",
      "Q",
      "q",
      "0.85 0.85 0.85 RG",
      "0.5 w",
      `40 ${rowY} m 555 ${rowY} l S`,
      "Q"
    );
  } else {
    events.forEach((event, idx) => {
      const rowY = headerY - 20 * (idx + 1);
      const complianceStatus = event.isCompliant ? "COMPLIANT" : "NON-COMPLIANT";

      // Row text
      streamContentLines.push(
        "q",
        "0.25 0.25 0.25 rg",
        "BT",
        "/F1 8.5 Tf",
        `50 ${rowY + 4} Td`,
        `(${escapePdfText(event.area)}) Tj`,
        `90 0 Td`,
        `(${escapePdfText(event.eventType)}) Tj`,
        `150 0 Td`,
        `(${escapePdfText(event.riskLevel.toUpperCase())}) Tj`,
        `110 0 Td`,
        `(${escapePdfText(complianceStatus)}) Tj`,
        "ET",
        "Q"
      );

      // Row line divider
      streamContentLines.push(
        "q",
        "0.85 0.85 0.85 RG",
        "0.5 w",
        `40 ${rowY} m 555 ${rowY} l S`,
        "Q"
      );
    });
  }

  // Footer divider and content
  streamContentLines.push(
    // Footer divider
    "q",
    "0.8 0.8 0.8 RG",
    "0.5 w",
    "40 100 m 555 100 l S",
    "Q",

    // Footer content
    "q",
    "0.5 0.5 0.5 rg",
    "BT",
    "/F1 8 Tf",
    "40 80 Td",
    "(Disclaimer: This is an automatically generated corporate document from the Complice & Auditoria platform.) Tj",
    "0 -12 Td",
    "(\\(C\\) 2026 Complice & Auditoria. All rights reserved. Confidentiality guidelines apply.) Tj",
    "ET",
    "Q"
  );

  const streamContent = streamContentLines.join("\n");
  const streamLength = streamContent.length;

  const objects = [
    "1 0 obj\n<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>\nendobj",
    "2 0 obj\n<<\n  /Type /Pages\n  /Kids [3 0 R]\n  /Count 1\n>>\nendobj",
    "3 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /Resources <<\n    /Font <<\n      /F1 4 0 R\n    >>\n  >>\n  /MediaBox [0 0 595.28 841.89]\n  /Contents 5 0 R\n>>\nendobj",
    "4 0 obj\n<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica\n>>\nendobj",
    `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`
  ];

  let pdfText = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdfText.length);
    pdfText += objects[i] + "\n";
  }

  const startxref = pdfText.length;
  pdfText += "xref\n";
  pdfText += `0 ${objects.length + 1}\n`;
  pdfText += "0000000000 65535 f \n";
  for (let i = 0; i < offsets.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, "0");
    pdfText += `${offsetStr} 00000 n \n`;
  }

  pdfText += "trailer\n<<\n";
  pdfText += `  /Size ${objects.length + 1}\n`;
  pdfText += "  /Root 1 0 R\n";
  pdfText += ">>\n";
  pdfText += "startxref\n";
  pdfText += `${startxref}\n`;
  pdfText += "%%EOF\n";

  return pdfText;
}
