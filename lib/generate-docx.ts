import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { SessionPayload } from "./types";
import { withStandardizedSignature } from "./letter-signature";

export async function generateDocx(payload: SessionPayload): Promise<Buffer> {
  const normalizedLetterText = withStandardizedSignature(
    payload.generatedLetter.letterText,
    payload.userInfo.fullName
  );
  const lines = normalizedLetterText.split("\n");

  const children: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Blank line → empty paragraph for spacing
    if (trimmed === "") {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 24 })],
          spacing: { after: 0 },
        })
      );
      continue;
    }

    // Subject line (RE: or SUBJECT:)
    if (trimmed.toUpperCase().startsWith("RE:") || trimmed.toUpperCase().startsWith("SUBJECT:")) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 24,
              font: "Times New Roman",
            }),
          ],
          spacing: { before: 120, after: 120 },
        })
      );
      continue;
    }

    // Regular paragraph
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 24, // 12pt
            font: "Times New Roman",
          }),
        ],
        spacing: { after: 0 },
      })
    );
  }


  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
