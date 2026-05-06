'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setEmail(user.email ?? null)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setProfile(data as Profile)
    } else {
      // Kein Profil — Trigger hat evtl. noch nicht gefeuert → selbst anlegen
      const { data: created } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: user.email?.split('@')[0] ?? 'User',
          timezone: 'Europe/Berlin',
        })
        .select()
        .single()
      if (created) setProfile(created as Profile)
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (
    updates: Partial<Pick<Profile, 'display_name' | 'klasse' | 'schule' | 'timezone' | 'onboarding_done'>>
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data as Profile)
      return true
    }
    return false
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return { profile, email, loading, updateProfile, signOut, refetch: fetchProfile }
}
