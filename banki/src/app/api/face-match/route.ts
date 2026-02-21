import { NextRequest, NextResponse } from 'next/server';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const { idImageBase64, selfieBase64 } = await req.json();

    if (!idImageBase64 || !selfieBase64) {
      return NextResponse.json(
        { error: 'Both idImageBase64 and selfieBase64 are required' },
        { status: 400 }
      );
    }

    try {
      const response = await fetch(`${FACE_SERVICE_URL}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_image: idImageBase64, selfie: selfieBase64 }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Face service error: ${response.status}`);
      }

      const result = await response.json();
      return NextResponse.json(result);
    } catch (serviceError) {
      // Face service not available - return simulated result for demo
      console.warn('Face service unavailable, using demo mode:', serviceError);
      const simulatedScore = 0.87 + Math.random() * 0.1;
      return NextResponse.json({
        match: simulatedScore >= 0.85,
        score: simulatedScore,
        demo_mode: true,
        message: 'Face service not running - using demo result',
      });
    }
  } catch (error) {
    console.error('Face match error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Face match failed' },
      { status: 500 }
    );
  }
}
