import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildUserContext } from '@/lib/ai/context'
import { buildEveningPrompt } from '@/lib/ai/prompts/evening'
import { JARVIS_SYSTEM_PROMPT } from '@/lib/ai/prompts/system'
import { streamAI, geminiSseToText } from '@/lib/ai/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const ctx = await buildUserContext(user.id)
    const prompt = buildEveningPrompt(ctx)

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
    console.error('[API] Evening briefing error:', err)
    return new NextResponse(
      'Review momentan nicht verfügbar. Reflektiere kurz selbst: Was hat heute funktioniert, was nicht?',
      { status: 200 }
    )
  }
}
