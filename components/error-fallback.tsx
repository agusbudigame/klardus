"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorFallbackProps {
  message?: string
  retry?: () => void
}

export function ErrorFallback({ message = "Terjadi kesalahan saat memuat aplikasi", retry }: ErrorFallbackProps) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!retry) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          retry()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [retry])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Saran Penyelesaian:</h2>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Periksa koneksi internet Anda</li>
            <li>Refresh halaman ini</li>
            <li>Buka aplikasi dari URL utama</li>
            <li>Pastikan Anda mengakses aplikasi melalui URL yang benar</li>
            <li>Hapus cache browser dan coba lagi</li>
          </ul>

          <div className="flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Halaman
            </Button>
            <Button onClick={() => (window.location.href = "/")} variant="outline" className="w-full">
              Kembali ke Halaman Utama
            </Button>
            {retry && (
              <Button onClick={retry} variant="outline" className="w-full mt-2">
                Coba Lagi {countdown > 0 ? `(${countdown})` : ""}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
