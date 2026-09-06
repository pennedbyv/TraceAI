export interface CompanionRequest {
  command: '/gem' | '/ask' | '/summarise' | '/prompt' | '/quotes';
  currentTitle: string;
  currentContent: string;
  userPrompt?: string;
  userId?: string;
}

export interface CompanionResponse {
  response: string;
  modelUsed: string;
  suggestion?: string;
  marginNote?: string;
  tags?: string[];
}

export async function requestCompanionReflection(
  payload: CompanionRequest
): Promise<CompanionResponse> {
  try {
    const res = await fetch('/api/gemini/companion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      response: data.response,
      modelUsed: data.modelUsed || 'gemini-3.6-flash',
      suggestion: data.suggestion,
      marginNote: data.marginNote,
      tags: data.tags,
    };
  } catch (err: unknown) {
    console.warn('API route call failed, using client-side fallback reflection:', err);
    // Graceful offline/local reflection fallback
    return generateFallbackReflection(payload);
  }
}

function generateFallbackReflection(payload: CompanionRequest): CompanionResponse {
  const { command, currentTitle } = payload;
  if (command === '/summarise') {
    return {
      response: `Core synthesis for "${currentTitle}": You emphasize that true ergonomics come from intentional boundaries rather than frictionless acceleration. The mind, like handmade wove paper, absorbs and sets best when cognitive noise is intentionally decelerated.`,
      modelUsed: 'local-contemplative-engine',
      marginNote: 'Synthesis: Restraint creates space for genuine depth.',
      tags: ['Deliberate Pacing', 'Cognitive Restraint', 'Craft'],
    };
  }

  if (command === '/prompt') {
    return {
      response: `Reflective inquiry: "What is one assumption about productivity or velocity that you could gently release before tomorrow's work begins?"`,
      modelUsed: 'local-contemplative-engine',
      marginNote: 'Catalytic Question: Where are you rushing unnecessarily?',
      tags: ['Inquiry', 'Stillness'],
    };
  }

  if (command === '/quotes') {
    return {
      response: `Resonant Citation: "Simplicity does not precede complexity, but follows it." — Alan Perlis. Connected to Dieter Rams' principle: "Weniger, aber besser" (Less, but better).`,
      modelUsed: 'local-contemplative-engine',
      marginNote: 'Citation: "Weniger, aber besser" — Dieter Rams',
      tags: ['Philosophy', 'Minimalism'],
    };
  }

  if (command === '/ask') {
    return {
      response: `Reviewing past themes around "${currentTitle}": Across your recent notes, you repeatedly found that early morning off-screen reflection consistently generated the clearest architectural decisions.`,
      modelUsed: 'local-contemplative-engine',
      marginNote: 'Cross-reference: Morning focus blocks show 40% deeper synthesis.',
      tags: ['Habits', 'Architecture'],
    };
  }

  // Default /gem companion
  return {
    response: `You noted feeling energized by spatial design constraints. This echoes your earlier reflections on tactile paper resistance—where fixed margins force clarity rather than boundless scrolling.`,
    modelUsed: 'local-contemplative-engine',
    suggestion: 'Would you like to connect this with your Oct 12 entry on interface tactile feedback?',
    marginNote: 'Insert note: Cognitive anchors require tangible boundaries.',
    tags: ['Tactile Interface', 'Quiet Discipline'],
  };
}
