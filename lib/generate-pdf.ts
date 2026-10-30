import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { SessionPayload } from "./types";
import { withStandardizedSignature } from "./letter-signature";

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
  const normalizedLetterText = withStandardizedSignature(
    payload.generatedLetter.letterText,
    payload.userInfo.fullName
  );

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
  const lines = normalizedLetterText.split("\n");
  for (const line of lines) {
    drawParagraph(line);
  }

  return await pdfDoc.save();
}
