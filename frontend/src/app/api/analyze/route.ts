import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  try {
    // In production, this would proxy to the Python API
    return NextResponse.json(
      { 
        error: "Analysis not available in production yet. Please run locally for full functionality.",
        message: "Analysis not available"
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
