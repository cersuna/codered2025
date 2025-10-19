import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production, this would proxy to the Python API
    return NextResponse.json({
      is_running: false,
      last_run: null,
      error: "API not available in production",
      posts_count: 0,
      sentiment_count: 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
