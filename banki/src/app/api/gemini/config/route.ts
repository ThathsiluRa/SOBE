import { NextResponse } from 'next/server';

/**
 * Returns the Gemini API key for client-side WebSocket use.
 * Safe for local demo — do not deploy publicly without auth.
 */
export async function GET() {
  const key = process.env.GEMINI_API_KEY || '';
  const configured = !!(key && key !== 'your-gemini-api-key-here');
  return NextResponse.json({ configured, apiKey: configured ? key : '' });
}
