"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function EnvWarningBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false)

  useEffect(() => {
    // Cek apakah menggunakan localStorage
    const hasLocalStorageCredentials = localStorage.getItem("SUPABASE_URL") && localStorage.getItem("SUPABASE_KEY")
    const hasEnvCredentials = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    setIsUsingLocalStorage(hasLocalStorageCredentials && !hasEnvCredentials)
    setIsVisible(hasLocalStorageCredentials && !hasEnvCredentials)
  }, [])

  if (!isVisible) return null

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-t-4 border-yellow-500 bg-yellow-50 text-yellow-800">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Menggunakan kredensial Supabase sementara dari browser. Untuk penggunaan permanen, atur variabel lingkungan
            di deployment Anda.{" "}
            <a href="/setup" className="underline font-medium">
              Lihat petunjuk setup
            </a>
          </AlertDescription>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="rounded-full p-1 hover:bg-yellow-100"
          aria-label="Tutup peringatan"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Alert>
  )
}
