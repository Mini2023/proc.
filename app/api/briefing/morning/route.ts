import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai/client'
import { buildUserContext } from '@/lib/ai/context'
import { buildMorningPrompt } from '@/lib/ai/prompts/morning'
import { JARVIS_SYSTEM_PROMPT } from '@/lib/ai/prompts/system'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { intention, nichtTun, energie } = await req.json()

  try {
    const ctx = await buildUserContext(user.id)

    // Load last night's morgen_hinweis
    const gestern = new Date()
    gestern.setDate(gestern.getDate() - 1)
    const { data: gestrigBriefing } = await supabase
      .from('briefings')
      .select('morgen_hinweis')
      .eq('user_id', user.id)
      .eq('datum', gestern.toISOString().split('T')[0])
      .eq('typ', 'evening')
      .maybeSingle()

    const prompt = buildMorningPrompt({
      ctx,
      intention: intention || '',
      nichtTun: nichtTun || '',
      energie: energie || 3,
      gestrigeSummary: gestrigBriefing?.morgen_hinweis || null,
    })

    const raw = await callAI({
      system: JARVIS_SYSTEM_PROMPT,
      userMessage: prompt,
      tier: 'heavy',
      maxTokens: 1000,
    })

    // Extract JSON even if the model wraps it in markdown code blocks
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('[AI] No JSON object in response')
    const result = JSON.parse(match[0])
    return NextResponse.json(result)
  } catch (err) {
    console.error('[API] Morning briefing error:', err)
    return NextResponse.json({ error: 'AI_UNAVAILABLE' }, { status: 503 })
  }
}
