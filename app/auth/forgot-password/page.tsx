"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Recycle, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Email harus diisi")
      return
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid")
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPassword(email)

      if (error) {
        if (error.message.includes("User not found")) {
          setError("Email tidak terdaftar dalam sistem")
        } else if (error.message.includes("Email rate limit exceeded")) {
          setError("Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit")
        } else {
          setError("Terjadi kesalahan saat mengirim email reset password")
        }
        return
      }

      setSuccess(true)
    } catch (err) {
      console.error("Reset password error:", err)
      setError("Terjadi kesalahan yang tidak terduga. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-600 p-4 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Terkirim!</h1>
            <p className="text-gray-600">Instruksi reset password telah dikirim ke email Anda</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <Mail className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">Kami telah mengirim link reset password ke:</p>
                  <p className="font-semibold text-gray-900 mt-1">{email}</p>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>Silakan periksa email Anda dan klik link yang diberikan untuk mengatur password baru.</p>
                  <p>Link akan kedaluwarsa dalam 1 jam.</p>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => {
                      setSuccess(false)
                      setEmail("")
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Kirim Ulang Email
                  </Button>

                  <Link href="/auth/login">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Kembali ke Login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-4 rounded-full">
              <Recycle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lupa Password?</h1>
          <p className="text-gray-600">Masukkan email Anda untuk reset password</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">{error}</div>}

        {/* Forgot Password Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Reset Password
            </CardTitle>
            <CardDescription>Kami akan mengirim link reset password ke email Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Link Reset Password"}
              </Button>

              <div className="text-center">
                <Link href="/auth/login" className="text-sm text-blue-600 hover:underline inline-flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Kembali ke Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Tidak menerima email?</p>
          <p>Periksa folder spam atau coba kirim ulang dalam beberapa menit</p>
        </div>
      </div>
    </div>
  )
}
