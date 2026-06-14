// SSE streaming utility for LLM Edge Function calls
// Uses native fetch + ReadableStream — no external dependencies required

export interface SSEOptions {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function streamLLM(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  options: SSEOptions,
  systemInstruction?: string
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/large-language-model`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ contents, systemInstruction }),
      signal: options.signal,
    });
  } catch (err) {
    if (!options.signal?.aborted) options.onError(err as Error);
    return;
  }

  if (!response.ok || !response.body) {
    options.onError(new Error(`HTTP ${response.status}`));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let accumulated = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") continue;

        try {
          const frame = JSON.parse(dataStr);
          const text = frame?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) { accumulated += text; options.onChunk(text); }
        } catch {
          // incomplete frame — skip
        }
      }
    }
    options.onComplete(accumulated);
  } catch (err) {
    if (!options.signal?.aborted) options.onError(err as Error);
  }
}

/** Blocking (non-streaming) helper — collects full text before returning */
export async function callLLM(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction?: string,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    streamLLM(
      contents,
      {
        onChunk: () => { /* accumulated in onComplete */ },
        onComplete: (fullText) => resolve(fullText),
        onError: reject,
        signal,
      },
      systemInstruction
    );
  });
}
