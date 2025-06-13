"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Recycle, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword, session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  // Check if user has valid session for password reset
  useEffect(() => {
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    if (!accessToken && !session) {
      // Redirect to forgot password if no valid session
      router.push("/auth/forgot-password")
    }
  }, [session, searchParams, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password minimal 6 karakter"
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password harus mengandung huruf kecil"
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password harus mengandung huruf besar"
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password harus mengandung angka"
    }
    return null
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.password || !formData.confirmPassword) {
      setError("Semua field harus diisi")
      return
    }

    // Validate password strength
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok")
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(formData.password)

      if (error) {
        if (error.message.includes("session_not_found")) {
          setError("Sesi reset password tidak valid atau sudah kedaluwarsa")
        } else if (error.message.includes("same_password")) {
          setError("Password baru tidak boleh sama dengan password lama")
        } else {
          setError("Terjadi kesalahan saat mengubah password")
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
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-600 p-4 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Berhasil Diubah!</h1>
            <p className="text-gray-600">Password Anda telah berhasil diperbarui</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <Lock className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">
                    Password Anda telah berhasil diubah. Sekarang Anda dapat masuk dengan password baru.
                  </p>
                </div>

                <div className="pt-4">
                  <Link href="/auth/login">
                    <Button className="w-full">Masuk ke Akun Anda</Button>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Buat Password Baru</h1>
          <p className="text-gray-600">Masukkan password baru untuk akun Anda</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">{error}</div>}

        {/* Reset Password Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Baru
            </CardTitle>
            <CardDescription>Buat password yang kuat untuk keamanan akun Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-2">Syarat Password:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li className={`flex items-center ${formData.password.length >= 6 ? "text-green-600" : ""}`}>
                    <span className="mr-2">{formData.password.length >= 6 ? "✓" : "•"}</span>
                    Minimal 6 karakter
                  </li>
                  <li className={`flex items-center ${/(?=.*[a-z])/.test(formData.password) ? "text-green-600" : ""}`}>
                    <span className="mr-2">{/(?=.*[a-z])/.test(formData.password) ? "✓" : "•"}</span>
                    Mengandung huruf kecil
                  </li>
                  <li className={`flex items-center ${/(?=.*[A-Z])/.test(formData.password) ? "text-green-600" : ""}`}>
                    <span className="mr-2">{/(?=.*[A-Z])/.test(formData.password) ? "✓" : "•"}</span>
                    Mengandung huruf besar
                  </li>
                  <li className={`flex items-center ${/(?=.*\d)/.test(formData.password) ? "text-green-600" : ""}`}>
                    <span className="mr-2">{/(?=.*\d)/.test(formData.password) ? "✓" : "•"}</span>
                    Mengandung angka
                  </li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mengubah Password..." : "Ubah Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Ingat password Anda?</p>
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  )
}
