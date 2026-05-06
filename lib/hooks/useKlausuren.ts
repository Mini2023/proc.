'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Klausur } from '@/types'

export function useKlausuren() {
  const [klausuren, setKlausuren] = useState<Klausur[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchKlausuren = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('klausuren')
      .select('*')
      .order('datum', { ascending: true })
    setKlausuren(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchKlausuren()
  }, [fetchKlausuren])

  const addKlausur = async (input: {
    fach: string
    thema?: string
    datum: string
    note_ziel?: number
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('klausuren')
      .insert({ ...input, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setKlausuren((prev) =>
        [...prev, data].sort(
          (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()
        )
      )
    }
  }

  const updateNote = async (id: string, note: number) => {
    const { error } = await supabase
      .from('klausuren')
      .update({ note })
      .eq('id', id)

    if (!error) {
      setKlausuren((prev) =>
        prev.map((k) => (k.id === id ? { ...k, note } : k))
      )
    }
  }

  const deleteKlausur = async (id: string) => {
    const { error } = await supabase.from('klausuren').delete().eq('id', id)
    if (!error) {
      setKlausuren((prev) => prev.filter((k) => k.id !== id))
    }
  }

  return {
    klausuren,
    loading,
    addKlausur,
    updateNote,
    deleteKlausur,
    refetch: fetchKlausuren,
  }
}
