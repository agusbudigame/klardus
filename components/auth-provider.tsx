"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type SupabaseContextType = {
  user: User | null
  session: Session | null
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null }
  }>
  signUp: (
    email: string,
    password: string,
    userType: "customer" | "collector",
    name: string,
  ) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null }
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  loading: boolean
  refreshProfile: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null)
  const [loading, setLoading] = useState(true)

  // Gunakan singleton client
  const supabase = getSupabaseClient()

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      if (!mounted) return

      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error("Error getting session:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.id)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return { error: null, data }
    } catch (error) {
      console.error("Error signing in:", error)
      return { error: error as Error, data: { user: null, session: null } }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userType: "customer" | "collector", name: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            user_type: userType,
          },
        },
      })

      if (error) {
        throw error
      }

      // Tambahkan kode berikut untuk memastikan user_type disimpan dengan benar
      if (data.user) {
        // Pastikan profil dibuat dengan user_type yang benar
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: email,
            name: name,
            user_type: userType,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )

        if (profileError) {
          console.error("Error updating profile:", profileError)
        }
      }

      return { error: null, data }
    } catch (error) {
      console.error("Error signing up:", error)
      return { error: error as Error, data: { user: null, session: null } }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      return { error: null }
    } catch (error) {
      console.error("Error resetting password:", error)
      return { error: error as Error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      return { error: null }
    } catch (error) {
      console.error("Error updating password:", error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    profile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    loading,
    refreshProfile,
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}

export const useAuth = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
