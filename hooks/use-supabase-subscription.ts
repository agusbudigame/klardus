"use client"

import { useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type TableName = keyof Database["public"]["Tables"]

interface UseSupabaseSubscriptionProps {
  table: TableName
  filter?: { column: string; value: any }
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
}

export function useSupabaseSubscription({ table, filter, onInsert, onUpdate, onDelete }: UseSupabaseSubscriptionProps) {
  const supabase = getSupabaseClient()

  useEffect(() => {
    let subscription: any

    const setupSubscription = () => {
      let channel = supabase.channel(`${table}_changes`)

      if (filter) {
        channel = channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `${filter.column}=eq.${filter.value}`,
          },
          (payload) => {
            switch (payload.eventType) {
              case "INSERT":
                onInsert?.(payload)
                break
              case "UPDATE":
                onUpdate?.(payload)
                break
              case "DELETE":
                onDelete?.(payload)
                break
            }
          },
        )
      } else {
        channel = channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
          },
          (payload) => {
            switch (payload.eventType) {
              case "INSERT":
                onInsert?.(payload)
                break
              case "UPDATE":
                onUpdate?.(payload)
                break
              case "DELETE":
                onDelete?.(payload)
                break
            }
          },
        )
      }

      subscription = channel.subscribe()
    }

    setupSubscription()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [table, filter, onInsert, onUpdate, onDelete])
}
