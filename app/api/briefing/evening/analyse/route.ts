import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'
import { buildUserContext } from '@/lib/ai/context'
import { buildEveningAnalysePrompt } from '@/lib/ai/prompts/evening'
import { JARVIS_SYSTEM_PROMPT } from '@/lib/ai/prompts/system'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { freitext, tagesStats } = await req.json()

  try {
    const ctx = await buildUserContext(user.id)

    const prompt = buildEveningAnalysePrompt({
      freitext: freitext || '',
      tagesStats: tagesStats || {
        erledigteTodos: 0,
        alleTodos: 0,
        sessions: [],
        lernplanErledigt: 0,
        lernplanGesamt: 0,
        klausurFach: null,
      },
      ctx,
    })

    const raw = await callAI({
      system: JARVIS_SYSTEM_PROMPT,
      userMessage: prompt,
      jsonMode: true,
      tier: 'heavy',
      maxTokens: 500,
    })

    const result = JSON.parse(raw)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[API] Evening analyse error:', err)
    return NextResponse.json({
      nachfragen: [
        { id: 'nf1', frage: 'Was war heute die größte Herausforderung?' },
      ],
    })
  }
}
