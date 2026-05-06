'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Todo } from '@/types'

export type TodoWithFach = Todo & { klausuren?: { fach: string } | null }

export function useTodos() {
  const [todos, setTodos] = useState<TodoWithFach[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchTodos = useCallback(async () => {
    setLoading(true)

    // Auto-import: move today's lernplan todos into "heute" column
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('todos')
      .update({ kategorie: 'heute' })
      .eq('lernplan_datum', today)
      .neq('kategorie', 'heute')
      .eq('fertig', false)

    const { data } = await supabase
      .from('todos')
      .select('*, klausuren(fach)')
      .order('sort_order', { ascending: true })
      .order('erstellt_at', { ascending: false })
    setTodos((data as TodoWithFach[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const addTodo = async (
    text: string,
    kategorie: 'heute' | 'backlog',
    prioritaet: 1 | 2 | 3 = 2,
    faelligAm?: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        text,
        kategorie,
        prioritaet,
        faellig_am: faelligAm || null,
      })
      .select('*, klausuren(fach)')
      .single()

    if (!error && data) {
      setTodos((prev) => [data as TodoWithFach, ...prev])
    }
  }

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    const newFertig = !todo.fertig

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, fertig: newFertig } : t))
    )

    const { error } = await supabase
      .from('todos')
      .update({ fertig: newFertig })
      .eq('id', id)

    if (error) {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fertig: todo.fertig } : t))
      )
    }
  }

  const moveTodo = async (id: string, kategorie: 'heute' | 'backlog') => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, kategorie } : t))
    )

    const { error } = await supabase
      .from('todos')
      .update({ kategorie })
      .eq('id', id)

    if (error) {
      fetchTodos()
    }
  }

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('todos').delete().eq('id', id)
  }

  const updateTodo = async (
    id: string,
    updates: Partial<Pick<Todo, 'text' | 'prioritaet' | 'faellig_am'>>
  ) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
    await supabase.from('todos').update(updates).eq('id', id)
  }

  return {
    todos,
    loading,
    addTodo,
    toggleTodo,
    moveTodo,
    deleteTodo,
    updateTodo,
    refetch: fetchTodos,
  }
}
