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
    console.warn('Gemini companion request failed:', err);
    throw err;
  }
}
