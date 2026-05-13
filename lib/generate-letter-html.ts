import { SessionPayload } from "./types";

/**
 * Font/size combinations that look like a real person typed the letter.
 * Each mailed letter randomly picks one so no two letters look identical.
 * Lob renders HTML to print — these are all standard web-safe fonts that
 * render reliably on Lob's print pipeline.
 */
const FONT_VARIATIONS = [
  { family: '"Times New Roman", Times, serif', size: '11pt', lineHeight: '1.5' },
  { family: '"Times New Roman", Times, serif', size: '12pt', lineHeight: '1.45' },
  { family: 'Georgia, "Times New Roman", serif', size: '11pt', lineHeight: '1.5' },
  { family: 'Georgia, "Times New Roman", serif', size: '12pt', lineHeight: '1.45' },
  { family: '"Palatino Linotype", Palatino, serif', size: '11pt', lineHeight: '1.5' },
  { family: '"Palatino Linotype", Palatino, serif', size: '11.5pt', lineHeight: '1.45' },
  { family: 'Arial, Helvetica, sans-serif', size: '11pt', lineHeight: '1.5' },
  { family: 'Arial, Helvetica, sans-serif', size: '10.5pt', lineHeight: '1.55' },
  { family: '"Trebuchet MS", Helvetica, sans-serif', size: '11pt', lineHeight: '1.5' },
  { family: 'Verdana, Geneva, sans-serif', size: '10pt', lineHeight: '1.55' },
  { family: '"Courier New", Courier, monospace', size: '11pt', lineHeight: '1.45' },
  { family: '"Lucida Console", Monaco, monospace', size: '10pt', lineHeight: '1.5' },
];

function pickFont() {
  return FONT_VARIATIONS[Math.floor(Math.random() * FONT_VARIATIONS.length)];
}

/**
 * Generate an HTML string of the letter for Lob mailing.
 * Lob accepts raw HTML (must start with <html>) and renders it to print.
 * Lob uses 8.5x11 letter size with 0.25" margins by default.
 *
 * Each letter gets a random font family and size so no two mailed letters
 * look the same — even if the text happened to be similar.
 */
export function generateLetterHtml(payload: SessionPayload): string {
  const { generatedLetter, userInfo } = payload;
  const letterText = generatedLetter.letterText;
  const font = pickFont();

  // Convert the plain-text letter into HTML paragraphs
  const paragraphs = letterText
    .split("\n")
    .map((line) => {
      if (line.trim() === "") return "<br />";
      // Escape HTML entities
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<p style="margin:0 0 2px 0;line-height:${font.lineHeight};">${escaped}</p>`;
    })
    .join("\n");

  return `<html>
<head>
<style>
  body {
    font-family: ${font.family};
    font-size: ${font.size};
    color: #000;
    margin: 0.75in 0.75in 0.75in 0.75in;
    line-height: ${font.lineHeight};
  }
  p {
    margin: 0 0 2px 0;
  }
  .signature-line {
    margin-top: 24px;
    border-top: 1px solid #000;
    width: 220px;
    padding-top: 4px;
  }
</style>
</head>
<body>
${paragraphs}

<div class="signature-line">${userInfo.fullName}</div>
</body>
</html>`;
}
