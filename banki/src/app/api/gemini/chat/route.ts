import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage } from '@/lib/gemini';
import { VOICE_ASSISTANT_SYSTEM_PROMPT } from '@/lib/prompts';
import type { GeminiMessage } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { history, message, contextInfo } = await req.json();

    let systemPrompt = VOICE_ASSISTANT_SYSTEM_PROMPT;
    if (contextInfo) {
      systemPrompt += `\n\n## CURRENT SESSION CONTEXT\n${JSON.stringify(contextInfo, null, 2)}`;
    }

    const response = await sendChatMessage(
      systemPrompt,
      history as GeminiMessage[],
      message as string
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Gemini chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
