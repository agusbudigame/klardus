"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8">Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Kembali ke Halaman Sebelumnya
          </Button>
        </div>
      </div>
    </div>
  )
}
