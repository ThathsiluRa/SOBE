// ============================================================
// Gemini API client for BANKI
// ============================================================

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your-gemini-api-key-here') {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to .env.local');
  }
  return key;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
}

/**
 * Send a chat message to Gemini and get a response
 */
export async function sendChatMessage(
  systemPrompt: string,
  history: GeminiMessage[],
  userMessage: string
): Promise<string> {
  const apiKey = getApiKey();

  const messages = [
    ...history,
    {
      role: 'user' as const,
      parts: [{ text: userMessage }],
    },
  ];

  const response = await fetch(
    `${GEMINI_API_BASE}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/**
 * Extract data from an ID document image using Gemini Vision
 */
export async function extractIDData(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${GEMINI_API_BASE}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Vision error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
}

/**
 * Get product recommendations from Gemini
 */
export async function getProductRecommendations(prompt: string): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(
    `${GEMINI_API_BASE}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
}
