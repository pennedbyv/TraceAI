type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
};

const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash'];

function getGeminiKey(): string | undefined {
  const key = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env?.GEMINI_API_KEY;
  return key && key !== '#' && key !== 'MY_GEMINI_API_KEY' ? key : undefined;
}

async function generateWithFallback(systemInstruction: string, prompt: string) {
  const key = getGeminiKey();
  if (!key) throw new Error('GEMINI_API_KEY is not configured on the server.');

  let lastError: unknown = null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generation_config: { temperature: 0.65, maxOutputTokens: 600 },
          }),
        },
      );
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        const detail = errorBody?.error?.message;
        throw new Error(
          detail
            ? `Gemini ${response.status}: ${detail}`
            : `Gemini request failed with status ${response.status}.`,
        );
      }
      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();
      if (text) return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body =
    req.body && typeof req.body === 'object'
      ? (req.body as Record<string, unknown>)
      : {};
  const command = String(body.command || '/gem').trim();
  const currentTitle = String(body.currentTitle || 'Untitled Entry').slice(0, 200);
  const currentContent = String(body.currentContent || '').slice(0, 8000);
  const userPrompt = String(body.userPrompt || '').slice(0, 1000);

  const systemInstruction = `You are Trace, a calm, deeply thoughtful AI companion embedded inside a private digital notebook for professionals.
Your tone is contemplative, refined, observant, and respectful. You are NOT a chirpy chatbot or a frantic assistant. You never sound like generic corporate SaaS.
You read the user's journal entry and offer resonant reflections, quiet breakthroughs, or catalytic questions. Keep replies concise (2-4 thoughtful sentences).
Do NOT include markdown formatting like giant headers or emoji walls. Speak with the understated elegance of an archival notebook editor.`;

  const prompt = `Command: ${command}
Journal Title: "${currentTitle}"
Journal Text:
"""
${currentContent}
"""
Additional user inquiry: "${userPrompt}"

Respond directly to the command:
- If /summarise: Provide a 2-3 sentence distillation of the core philosophical or strategic breakthrough in the text.
- If /prompt: Provide one sharp, catalytic question that unblocks further contemplation.
- If /quotes: Share one resonant, historical philosophical citation that illuminates this theme.
- If /ask: Answer the user's question with contextual depth drawn from the journal text.
- If /gem: Offer a thoughtful, observant reflection and suggest a connection to a deeper theme.`;

  try {
    const result = await generateWithFallback(systemInstruction, prompt);
    res.json({
      ok: true,
      response: result.text,
      modelUsed: result.modelUsed,
      marginNote: `Companion insight on ${currentTitle.slice(0, 30)}...`,
      tags: ['AI Companion', 'Contemplation'],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'AI Companion generation unavailable';
    const isKeyMissing = msg.includes('not configured');
    res.status(isKeyMissing ? 500 : 503).json({
      ok: false,
      error: isKeyMissing
        ? 'GEMINI_API_KEY is not configured. Add it to Vercel environment variables.'
        : msg,
    });
  }
}
