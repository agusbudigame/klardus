"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { Recycle, Truck, Users } from "lucide-react"
import Link from "next/link"

export default function Register() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleRegister = async (userType: "customer" | "collector") => {
    setError(null)

    if (!formData.name || !formData.email || !formData.password) {
      setError("Semua field harus diisi")
      return
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok")
      return
    }

    setLoading(true)

    try {
      const { error, data } = await signUp(formData.email, formData.password, userType, formData.name)

      if (error) {
        // Handle specific error types
        if (error.message.includes("already registered")) {
          setError("Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.")
        } else if (error.message.includes("Invalid email")) {
          setError("Format email tidak valid")
        } else if (error.message.includes("Password")) {
          setError("Password terlalu lemah. Gunakan minimal 6 karakter.")
        } else {
          setError("Terjadi kesalahan saat registrasi. Silakan coba lagi.")
        }
        return
      }

      if (data.user) {
        // Show success message with role information
        alert(
          `Registrasi berhasil sebagai ${userType === "customer" ? "Pelanggan" : "Pengepul"}! Silakan periksa email Anda untuk verifikasi.`,
        )

        // Log untuk debugging
        console.log(`User registered as ${userType}`, data.user)

        // Redirect to appropriate dashboard
        if (userType === "customer") {
          router.push("/customer/dashboard")
        } else {
          router.push("/collector/dashboard")
        }
      }
    } catch (err) {
      console.error("Registration error:", err)
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Daftar Akun Baru</h1>
          <p className="text-gray-600">Bergabung dengan platform jual beli kardus bekas</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">{error}</div>}

        {/* Register Form */}
        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer">Pelanggan</TabsTrigger>
            <TabsTrigger value="collector">Pengepul</TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Daftar sebagai Pelanggan
                </CardTitle>
                <CardDescription>Jual kardus bekas Anda dengan mudah</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
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
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button className="w-full" onClick={() => handleRegister("customer")} disabled={loading}>
                  {loading ? "Mendaftar..." : "Daftar sebagai Pelanggan"}
                </Button>
                <div className="text-center text-sm text-gray-600">
                  Sudah punya akun?{" "}
                  <Link href="/auth/login" className="text-blue-600 hover:underline">
                    Masuk di sini
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collector">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Daftar sebagai Pengepul
                </CardTitle>
                <CardDescription>Kelola bisnis pengepulan kardus Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
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
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleRegister("collector")}
                  disabled={loading}
                >
                  {loading ? "Mendaftar..." : "Daftar sebagai Pengepul"}
                </Button>
                <div className="text-center text-sm text-gray-600">
                  Sudah punya akun?{" "}
                  <Link href="/auth/login" className="text-blue-600 hover:underline">
                    Masuk di sini
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
