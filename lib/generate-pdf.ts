import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { SessionPayload } from "./types";

// Word-wrap helper
function wrapText(text: string, maxWidth: number, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export async function generatePdf(payload: SessionPayload): Promise<Uint8Array> {
  const { generatedLetter, userInfo } = payload;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const pageWidth = 612;  // US Letter
  const pageHeight = 792;
  const marginLeft = 72;
  const marginRight = 72;
  const marginTop = 72;
  const marginBottom = 72;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const fontSize = 11;
  const lineHeight = fontSize * 1.4;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;

  function checkNewPage() {
    if (y < marginBottom + lineHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - marginTop;
    }
  }

  function drawLine(text: string, isBold = false, indent = 0) {
    checkNewPage();
    page.drawText(text, {
      x: marginLeft + indent,
      y,
      size: fontSize,
      font: isBold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
  }

  function drawParagraph(text: string) {
    if (!text.trim()) {
      y -= lineHeight * 0.6; // Blank line spacing
      return;
    }

    const isSubject =
      text.trim().toUpperCase().startsWith("RE:") ||
      text.trim().toUpperCase().startsWith("SUBJECT:");

    const wrapped = wrapText(text, contentWidth, font, fontSize);
    for (const line of wrapped) {
      checkNewPage();
      page.drawText(line, {
        x: marginLeft,
        y,
        size: fontSize,
        font: isSubject ? fontBold : font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }
  }

  // Draw the letter body
  const lines = generatedLetter.letterText.split("\n");
  for (const line of lines) {
    drawParagraph(line);
  }

  // Signature area
  y -= lineHeight;
  checkNewPage();
  page.drawLine({
    start: { x: marginLeft, y },
    end: { x: marginLeft + 220, y },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight;
  drawLine(userInfo.fullName);

  return await pdfDoc.save();
}
