"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SetupPage() {
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleCopyCommand = () => {
    const command = `npx vercel env add NEXT_PUBLIC_SUPABASE_URL && npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY`
    navigator.clipboard.writeText(command)
  }

  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult({
        success: false,
        message: "Harap masukkan URL dan API Key Supabase",
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { error } = await supabase.from("profiles").select("id").limit(1)

      if (error) {
        throw error
      }

      setTestResult({
        success: true,
        message: "Koneksi berhasil! Variabel lingkungan Anda bekerja dengan baik.",
      })

      // Simpan ke localStorage untuk penggunaan sementara
      localStorage.setItem("SUPABASE_URL", supabaseUrl)
      localStorage.setItem("SUPABASE_KEY", supabaseKey)
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Koneksi gagal: ${error.message || "Unknown error"}`,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Setup Aplikasi Kardus Collector</CardTitle>
            <CardDescription>
              Aplikasi memerlukan konfigurasi Supabase untuk berfungsi dengan baik. Ikuti langkah-langkah di bawah ini
              untuk mengatur variabel lingkungan yang diperlukan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Variabel Lingkungan Tidak Ditemukan</AlertTitle>
              <AlertDescription>
                Aplikasi tidak dapat menemukan variabel lingkungan Supabase yang diperlukan. Anda perlu mengatur
                variabel ini di deployment Anda.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Opsi 1: Mengatur Variabel Lingkungan di Vercel</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Buka{" "}
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    Vercel Dashboard <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>Pilih project Anda</li>
                <li>Buka tab Settings &gt; Environment Variables</li>
                <li>
                  Tambahkan dua variabel berikut:
                  <ul className="list-disc pl-5 mt-1">
                    <li>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> - URL Supabase
                      Anda
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> - API Key
                      Supabase Anda
                    </li>
                  </ul>
                </li>
                <li>Klik Save dan redeploy aplikasi Anda</li>
              </ol>

              <div className="bg-gray-100 p-3 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Command untuk CLI:</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyCommand}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="text-xs block overflow-x-auto whitespace-pre">
                  npx vercel env add NEXT_PUBLIC_SUPABASE_URL && npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Opsi 2: Test Koneksi Sementara</h3>
              <p className="text-sm text-gray-600">
                Anda dapat menguji koneksi dengan memasukkan kredensial Supabase di bawah ini. Ini hanya untuk pengujian
                dan akan disimpan di browser Anda.
              </p>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="supabase-url">Supabase URL</Label>
                  <Input
                    id="supabase-url"
                    placeholder="https://your-project.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                  <Input
                    id="supabase-key"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                  />
                </div>

                <Button onClick={handleTestConnection} disabled={testing}>
                  {testing ? "Testing..." : "Test Koneksi"}
                </Button>

                {testResult && (
                  <Alert variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{testResult.success ? "Sukses" : "Error"}</AlertTitle>
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Mendapatkan Kredensial Supabase</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Buka{" "}
                  <a
                    href="https://app.supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    Supabase Dashboard <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>Pilih project Anda</li>
                <li>Buka tab Project Settings &gt; API</li>
                <li>
                  Copy <strong>Project URL</strong> dan <strong>anon public</strong> key
                </li>
              </ol>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Kembali ke Halaman Utama
            </Button>
            <Button onClick={() => window.location.reload()}>Refresh Halaman</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
