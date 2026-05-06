const GEMINI_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models'

// ── Model cascades ───────────────────────────────────────────────────────────

const HEAVY_CASCADE = [
  'gemini-3.0-flash',   // primary
  'gemini-2.5-flash',   // fallback
]

const LIGHT_CASCADE = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
]

// ── Core cascade logic ───────────────────────────────────────────────────────

async function cascadeModels(
  models: string[],
  endpoint: 'generateContent' | 'streamGenerateContent',
  body: object
): Promise<Response> {
  const key = process.env.GEMINI_API_KEY
  const errors: string[] = []

  for (const model of models) {
    const url = `${GEMINI_BASE}/${model}:${endpoint}?key=${key}${
      endpoint === 'streamGenerateContent' ? '&alt=sse' : ''
    }`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (response.ok) return response

    // Retry on model-not-found / quota errors
    if ([400, 404, 429, 503].includes(response.status)) {
      const text = await response.text()
      errors.push(`${model}:${response.status}`)
      console.warn(`[AI] ${model} failed (${response.status}), trying next:`, text.slice(0, 120))
      continue
    }

    return response // Surface other errors directly
  }

  throw new Error(`[AI] All models failed — ${errors.join(' → ')}`)
}

// ── Public API ───────────────────────────────────────────────────────────────

interface CallOptions {
  system: string
  userMessage: string
  maxTokens?: number
  jsonMode?: boolean
  tier?: 'heavy' | 'light'
}

interface StreamOptions {
  system: string
  userMessage: string
  tier?: 'heavy' | 'light'
}

export async function callAI(options: CallOptions): Promise<string> {
  const models = options.tier === 'light' ? LIGHT_CASCADE : HEAVY_CASCADE

  const body = {
    system_instruction: { parts: [{ text: options.system }] },
    contents: [{ role: 'user', parts: [{ text: options.userMessage }] }],
    generationConfig: {
      maxOutputTokens: options.maxTokens ?? 1000,
      // JSON mode omitted — prompt must instruct model to respond with JSON,
      // and callers extract JSON manually (handles model variation better)
    },
  }

  const response = await cascadeModels(models, 'generateContent', body)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`[AI] generateContent failed ${response.status}: ${errorText.slice(0, 200)}`)
  }
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function streamAI(options: StreamOptions): Promise<ReadableStream> {
  const models = options.tier === 'light' ? LIGHT_CASCADE : HEAVY_CASCADE

  const body = {
    system_instruction: { parts: [{ text: options.system }] },
    contents: [{ role: 'user', parts: [{ text: options.userMessage }] }],
  }

  const response = await cascadeModels(models, 'streamGenerateContent', body)
  return response.body!
}

// ── Stream transformer: Gemini SSE → plain text stream ───────────────────────
// Used in API routes to forward clean text to the browser

export function geminiSseToText(geminiBody: ReadableStream): ReadableStream {
  const reader = geminiBody.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            // Flush remaining buffer
            processLines(buffer, controller, encoder)
            controller.close()
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const lastNewline = buffer.lastIndexOf('\n')
          if (lastNewline === -1) continue

          const complete = buffer.slice(0, lastNewline + 1)
          buffer = buffer.slice(lastNewline + 1)
          processLines(complete, controller, encoder)
        }
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

function processLines(
  chunk: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  for (const line of chunk.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data: ')) continue
    try {
      const json = JSON.parse(trimmed.slice(6))
      const text: string | undefined =
        json.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) controller.enqueue(encoder.encode(text))
    } catch {
      // Incomplete JSON chunk — skip
    }
  }
}
