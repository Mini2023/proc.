import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LernplanTag } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { klausurId, lernplan } = (await req.json()) as {
    klausurId: string
    lernplan: LernplanTag[]
  }

  if (!klausurId || !lernplan) {
    return new NextResponse('klausurId oder lernplan fehlt', { status: 400 })
  }

  const { error } = await supabase
    .from('klausuren')
    .update({ lernplan })
    .eq('id', klausurId)
    .eq('user_id', user.id)

  if (error) return new NextResponse(error.message, { status: 500 })

  // Sync the done state in todos as well
  const doneTasks = lernplan.flatMap((tag) =>
    tag.tasks
      .filter((t) => t.done)
      .map((t) => ({ datum: tag.datum, text: t.text }))
  )

  if (doneTasks.length > 0) {
    for (const task of doneTasks) {
      await supabase
        .from('todos')
        .update({ fertig: true })
        .eq('klausur_id', klausurId)
        .eq('lernplan_datum', task.datum)
        .eq('text', task.text)
    }
  }

  return NextResponse.json({ success: true })
}
