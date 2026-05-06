import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamAI, geminiSseToText } from '@/lib/ai/client'
import { buildUserContext } from '@/lib/ai/context'
import { buildEveningFeedbackPrompt } from '@/lib/ai/prompts/evening'
import { JARVIS_SYSTEM_PROMPT } from '@/lib/ai/prompts/system'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { freitext, nachfragenAntworten, tagesStats } = await req.json()

  try {
    const ctx = await buildUserContext(user.id)

    const prompt = buildEveningFeedbackPrompt({
      freitext: freitext || '',
      nachfragenAntworten: nachfragenAntworten || [],
      tagesStats: tagesStats || {},
      ctx,
    })

    const geminiStream = await streamAI({
      system: JARVIS_SYSTEM_PROMPT,
      userMessage: prompt,
      tier: 'heavy',
    })

    const textStream = geminiSseToText(geminiStream)

    return new Response(textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('[API] Evening feedback error:', err)
    return new NextResponse(
      'Review momentan nicht verfügbar. Reflektiere kurz selbst: Was hat heute funktioniert, was nicht?\nMORNING_HINT:{"text":null}',
      { status: 200 }
    )
  }
}
