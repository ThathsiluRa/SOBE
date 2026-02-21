import { NextRequest, NextResponse } from 'next/server';
import { extractIDData } from '@/lib/gemini';
import { ID_EXTRACTION_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'imageBase64 and mimeType are required' },
        { status: 400 }
      );
    }

    const raw = await extractIDData(imageBase64, mimeType, ID_EXTRACTION_PROMPT);

    // Clean up markdown code blocks if Gemini wraps the JSON
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse Gemini response as JSON', raw },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Vision extraction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Vision extraction failed' },
      { status: 500 }
    );
  }
}
