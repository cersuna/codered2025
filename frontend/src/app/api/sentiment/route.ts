import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production, this would proxy to the Python API
    // For now, return a message that the API is not available
    return NextResponse.json(
      { 
        error: "API not available in production yet. Please run locally for full functionality.",
        sentiment: [] 
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
