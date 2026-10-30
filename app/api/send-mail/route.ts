import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct mail submission from the client has been disabled. Mailing is automatically processed by the payment webhook.",
      statusEndpoint: "/api/mail-status",
    },
    { status: 410 }
  );
}