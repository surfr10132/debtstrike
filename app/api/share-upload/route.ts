import { NextResponse } from "next/server";
import { saveSession } from "@/lib/session-store";
import { SessionPayload } from "@/lib/types";
import { getAnthropic } from "@/lib/claude";
import {
  finalizeClientDropboxFolder,
  syncClientRecordToGoogleSheet,
} from "@/lib/client-record-sync";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const screenshot = formData.get("screenshot") as File | null;
    const payloadJson = formData.get("payload") as string | null;
    const existingPayloadId = formData.get("payload_id");

    if (!screenshot || !payloadJson) {
      return NextResponse.json(
        { error: "Missing screenshot or payload" },
        { status: 400 }
      );
    }

    // Validate it's an image
    if (!screenshot.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload an image file (JPG, PNG, WebP)" },
        { status: 400 }
      );
    }

    // Max 10MB
    if (screenshot.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 10MB" },
        { status: 400 }
      );
    }

    // Convert image to base64 for Claude vision
    const bytes = await screenshot.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Determine media type
    let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" =
      "image/jpeg";
    if (screenshot.type === "image/png") mediaType = "image/png";
    else if (screenshot.type === "image/webp") mediaType = "image/webp";
    else if (screenshot.type === "image/gif") mediaType = "image/gif";

    // Use Claude vision to verify the screenshot
    const verificationResponse = await getAnthropic().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Analyze this screenshot. Does it show a social media post (Instagram, TikTok, Facebook, Twitter/X, or similar platform) that mentions DebtStrike, debtstrike.io, or debt strike in any form?

Respond with ONLY a JSON object:
{
  "isValid": true/false,
  "platform": "instagram" | "tiktok" | "twitter" | "facebook" | "other" | "unknown",
  "reason": "brief explanation"
}

Be generous — if it looks like a genuine social media post that mentions DebtStrike in any way (caption, comments, hashtags, screen recording, story), mark it valid. Only reject if it's clearly not a social media post or doesn't mention DebtStrike at all.`,
            },
          ],
        },
      ],
    });

    // Parse Claude's response
    const responseText =
      verificationResponse.content[0].type === "text"
        ? verificationResponse.content[0].text
        : "";

    let verification: {
      isValid: boolean;
      platform: string;
      reason: string;
    };

    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      verification = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { isValid: false, platform: "unknown", reason: "Could not parse" };
    } catch {
      verification = {
        isValid: false,
        platform: "unknown",
        reason: "Could not verify screenshot",
      };
    }

    if (!verification.isValid) {
      return NextResponse.json(
        {
          error:
            "We couldn't verify a DebtStrike post in this screenshot. Make sure the post mentions DebtStrike or debtstrike.io and try again.",
          reason: verification.reason,
        },
        { status: 422 }
      );
    }

    // Save the screenshot to public/social-proof
    const timestamp = Date.now();
    const ext = screenshot.name.split(".").pop() || "jpg";
    const filename = `share-${timestamp}-${verification.platform}.${ext}`;
    const filepath = path.join(
      process.cwd(),
      "public",
      "social-proof",
      filename
    );

    try {
      await writeFile(filepath, Buffer.from(bytes));
    } catch (err) {
      // Non-fatal — on Vercel the filesystem is read-only, just log it
      console.log(
        "[share-upload] Could not save to filesystem (expected on Vercel):",
        err
      );
    }

    // Parse and save the session payload
    const sessionPayload: SessionPayload = JSON.parse(payloadJson);
    const payloadId = await saveSession(
      sessionPayload,
      typeof existingPayloadId === "string" && existingPayloadId.trim()
        ? existingPayloadId
        : undefined
    );
    const dropboxFolderPath = await finalizeClientDropboxFolder({
      payloadId,
      payload: sessionPayload,
    });
    await syncClientRecordToGoogleSheet(sessionPayload, {
      payloadId,
      orderType: "share_unlock",
      mailingStatus: "share_unlocked",
      dropboxFolderPath,
    });

    // Log the share event
    console.log(
      `[SHARE] Free letter unlocked via ${verification.platform} post at ${new Date().toISOString()}. Payload: ${payloadId}`
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_BASE_URL is not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      platform: verification.platform,
      payloadId,
      downloadUrl: `${baseUrl}/success?session_id=share_unlock&payload_id=${payloadId}`,
    });
  } catch (error) {
    console.error("Share upload error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
