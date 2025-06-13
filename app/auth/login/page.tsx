"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Recycle, LogIn, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function Login() {
  const router = useRouter()
  const { signIn, profile, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (profile.user_type === "customer") {
        router.push("/customer/dashboard")
      } else if (profile.user_type === "collector") {
        router.push("/collector/dashboard")
      }
    }
  }, [user, profile, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError("Email dan password harus diisi")
      return
    }

    setLoading(true)

    try {
      const { error, data } = await signIn(formData.email, formData.password)

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Email atau password salah")
        } else if (error.message.includes("Email not confirmed")) {
          setError("Silakan verifikasi email Anda terlebih dahulu")
        } else if (error.message.includes("Too many requests")) {
          setError("Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit")
        } else {
          setError("Terjadi kesalahan saat login. Silakan coba lagi.")
        }
        return
      }

      if (data.user) {
        // Redirect akan ditangani oleh useEffect di atas
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Terjadi kesalahan yang tidak terduga. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Masuk ke Akun Anda</h1>
          <p className="text-gray-600">Platform jual beli kardus bekas yang efisien</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">{error}</div>}

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Login
            </CardTitle>
            <CardDescription>Masukkan email dan password Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Lupa password?
                  </Link>
                </div>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Masuk..." : "Masuk"}
              </Button>
              <div className="text-center text-sm text-gray-600">
                Belum punya akun?{" "}
                <Link href="/auth/register" className="text-blue-600 hover:underline">
                  Daftar di sini
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Mengalami masalah saat login?</p>
          <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
            Reset password Anda
          </Link>
        </div>
      </div>
    </div>
  )
}
