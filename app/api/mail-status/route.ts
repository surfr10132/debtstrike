import { NextResponse } from "next/server";
import { getFulfillment } from "@/lib/fulfillment-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const payloadId = searchParams.get("payload_id");

    if (!sessionId || !payloadId) {
      return NextResponse.json(
        { error: "Missing required parameters." },
        { status: 400 }
      );
    }

    const record = await getFulfillment(sessionId);
    if (!record) {
      return NextResponse.json({ status: "pending" });
    }

    if (record.payloadId !== payloadId) {
      return NextResponse.json(
        { error: "Session mismatch." },
        { status: 403 }
      );
    }

    if (record.orderType === "debt_letter") {
      return NextResponse.json({ status: "not_applicable" });
    }

    if (record.mailingStatus === "submitted") {
      return NextResponse.json({
        status: "submitted",
        trackingNumber: record.trackingNumber ?? null,
        lobLetterId: record.lobLetterId ?? null,
        expectedDeliveryDate: record.expectedDeliveryDate ?? null,
      });
    }

    if (record.mailingStatus === "failed") {
      return NextResponse.json({
        status: "failed",
        error: record.lastError || "Mail submission failed.",
      });
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    console.error("[mail-status] Failed to get mail status:", error);
    return NextResponse.json(
      { error: "Failed to get mail status." },
      { status: 500 }
    );
  }
}
