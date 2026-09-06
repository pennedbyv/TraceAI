import express, { type Request, type Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
// Must be mounted before any endpoint routes
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'trace-private-journal-server',
    timestamp: new Date().toISOString(),
  });
});

// Resilient Gemini Model Fallback Ladder
const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

/**
 * Resilient helper executing content generation with automated fallback
 */
async function generateWithFallback(systemInstruction: string, prompt: string) {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  let lastError: unknown = null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.65,
          maxOutputTokens: 600,
        },
      });

      if (response && response.text) {
        return {
          text: response.text.trim(),
          modelUsed: model,
        };
      }
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number; statusCode?: number })?.status || (err as { status?: number; statusCode?: number })?.statusCode;
      console.warn(`Model ${model} attempt failed (status ${status}). Trying next fallback...`);
      // Continue to next model in fallback ladder
    }
  }

  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}

/**
 * Server-side Gemini AI Companion endpoint for the Private Journal
 */
app.post('/api/gemini/companion', async (req: Request, res: Response) => {
  // Defensive Payload Ingestion (Null-Safe Destructuring)
  const body = req.body && typeof req.body === 'object' ? req.body : {};
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
- If /quotes: Share one resonant, historical philosophical citation (e.g. Marcus Aurelius, Dieter Rams, Simone Weil, Matsuo Basho) that illuminates this theme.
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
    console.warn('Companion generation error:', msg);
    res.status(503).json({
      ok: false,
      error: msg.includes('not configured')
        ? 'GEMINI_API_KEY is not configured. Add it to TraceAI/.env or the workspace .env and restart the server.'
        : 'Gemini rejected the request.',
    });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trace Private Journal Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
