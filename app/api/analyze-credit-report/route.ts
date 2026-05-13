import { NextResponse } from "next/server";
import anthropic from "@/lib/claude";
import { CreditReportItem } from "@/lib/types";

export const maxDuration = 60; // Allow up to 60s for large reports

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { file: base64, fileName, fileType } = body as {
      file: string;
      fileName: string;
      fileType: string;
    };

    if (!base64) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (fileType !== "application/pdf" && !fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a PDF or image of your credit report" },
        { status: 400 }
      );
    }

    // Determine media type for Claude
    let mediaType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "application/pdf";
    if (fileType === "image/jpeg" || fileType === "image/jpg") mediaType = "image/jpeg";
    else if (fileType === "image/png") mediaType = "image/png";
    else if (fileType === "image/webp") mediaType = "image/webp";
    else if (fileType === "image/gif") mediaType = "image/gif";

    const isPdf = fileType === "application/pdf";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [
            isPdf
              ? {
                  type: "document" as const,
                  source: {
                    type: "base64" as const,
                    media_type: "application/pdf" as const,
                    data: base64,
                  },
                }
              : {
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                    data: base64,
                  },
                },
            {
              type: "text",
              text: `You are a credit report analyzer. Extract ALL negative, derogatory, or potentially disputable items from this credit report.

For each item found, provide:
- bureau: Which credit bureau is reporting it (TransUnion, Experian, or Equifax). If the report is a tri-merge report, the same account may appear under multiple bureaus — list each as a SEPARATE item.
- creditorName: The name of the creditor or collection agency
- accountNumber: The account number (partial is fine)
- accountType: e.g., "Collection", "Credit Card", "Auto Loan", "Student Loan", "Medical", "Mortgage", etc.
- balance: The balance or amount owed
- status: The account status exactly as shown — e.g., "Collection", "Charge-off", "Late 30 days", "Late 60 days", "Late 90 days", "Derogatory", "Closed", etc.
- dateOpened: When the account was opened or reported
- dateReported: The most recent reporting date
- reason: A plain-English explanation of why this item is negative and why it should be disputed. Be specific — mention inaccuracies, outdated info, incomplete reporting, or any FCRA violation basis.

Only include items that are NEGATIVE or DEROGATORY. Do not include accounts in good standing.

If the report shows NO negative items, return an empty array.

Respond with ONLY a JSON object in this exact format:
{
  "items": [
    {
      "bureau": "TransUnion",
      "creditorName": "Example Collection Agency",
      "accountNumber": "XXXX1234",
      "accountType": "Collection",
      "balance": "$1,500",
      "status": "Collection",
      "dateOpened": "01/2023",
      "dateReported": "03/2026",
      "reason": "This collection account may be reporting inaccurately. The balance amount should be verified, and the collector must prove the chain of ownership from the original creditor."
    }
  ]
}`,
            },
          ],
        },
      ],
    });

    // Parse Claude's response
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let items: CreditReportItem[] = [];

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        items = (parsed.items || []).map(
          (item: Omit<CreditReportItem, "id" | "selected">, index: number) => ({
            ...item,
            id: `item-${index}`,
            selected: true, // Default all items to selected
          })
        );
      }
    } catch {
      console.error("Failed to parse credit report analysis:", responseText);
      return NextResponse.json(
        { error: "Could not analyze the credit report. Please try a clearer image or PDF." },
        { status: 422 }
      );
    }

    // Calculate bureau breakdown
    const bureauBreakdown = {
      TransUnion: items.filter((i) => i.bureau === "TransUnion").length,
      Experian: items.filter((i) => i.bureau === "Experian").length,
      Equifax: items.filter((i) => i.bureau === "Equifax").length,
    };

    return NextResponse.json({
      items,
      totalNegativeItems: items.length,
      bureauBreakdown,
    });
  } catch (error) {
    console.error("Credit report analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze credit report. Please try again." },
      { status: 500 }
    );
  }
}
