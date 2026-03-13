import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { SessionPayload } from "./types";

export async function generateDocx(payload: SessionPayload): Promise<Buffer> {
  const { generatedLetter } = payload;
  const lines = generatedLetter.letterText.split("\n");

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

  // Signature area
  children.push(
    new Paragraph({ children: [new TextRun({ text: "", size: 24 })] }),
    new Paragraph({ children: [new TextRun({ text: "", size: 24 })] }),
    new Paragraph({
      children: [
        new TextRun({
          text: "_________________________________",
          size: 24,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: payload.userInfo.fullName,
          size: 24,
          font: "Times New Roman",
        }),
      ],
    })
  );

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
