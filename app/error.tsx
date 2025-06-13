"use client"

import { useEffect } from "react"
import { ErrorFallback } from "@/components/error-fallback"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error ke layanan analitik
    console.error("Route error:", error)
  }, [error])

  return <ErrorFallback message={error.message} retry={reset} />
}
