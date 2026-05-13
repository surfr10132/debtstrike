import { NextResponse } from 'next/server';

// Debug endpoint disabled for security — was exposing API key prefixes
export async function GET() {
  return NextResponse.json(
    { error: 'Debug endpoint is disabled.' },
    { status: 403 }
  );
}
