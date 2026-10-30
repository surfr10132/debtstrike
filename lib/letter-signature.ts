function normalizeLine(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function isTrailingSignatureLine(line: string, fullName: string): boolean {
  const normalized = normalizeLine(line);
  const normalizedName = normalizeLine(fullName);

  if (!normalized) return true;
  if (normalized === normalizedName) return true;
  if (normalized === `/s/ ${normalizedName}`) return true;
  if (/^[_-]{3,}$/.test(normalized)) return true;

  return false;
}

export function withStandardizedSignature(
  letterText: string,
  fullName: string
): string {
  const lines = letterText.split("\n");

  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  while (
    lines.length > 0 &&
    isTrailingSignatureLine(lines[lines.length - 1], fullName)
  ) {
    lines.pop();
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }
  }

  const core = lines.join("\n").trimEnd();
  return `${core}\n/s/ ${fullName}\n${fullName}`;
}
