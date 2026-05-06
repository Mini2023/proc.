'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FocusSession } from '@/types'

export function useFocusSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data } = await supabase
      .from('focus_sessions')
      .select('*')
      .gte('gestartet_at', weekAgo.toISOString())
      .order('gestartet_at', { ascending: false })

    setSessions(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const today = new Date().toISOString().split('T')[0]

  const todaySessions = sessions.filter((s) =>
    s.gestartet_at.startsWith(today)
  )

  const weeklyMinutes = sessions
    .filter((s) => s.abgeschlossen)
    .reduce((sum, s) => sum + s.dauer_minuten, 0)

  const todayPomodoros = todaySessions.filter((s) => s.abgeschlossen).length
  const todayMinutes = todaySessions
    .filter((s) => s.abgeschlossen)
    .reduce((sum, s) => sum + s.dauer_minuten, 0)

  return {
    sessions,
    todaySessions,
    todayPomodoros,
    todayMinutes,
    weeklyMinutes,
    loading,
    refetch: fetchSessions,
  }
}
