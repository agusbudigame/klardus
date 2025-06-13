"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Recycle,
  Truck,
  TrendingUp,
  MapPin,
  Clock,
  Shield,
  Users,
  Star,
  CheckCircle,
  Phone,
  Mail,
  Download,
  Smartphone,
  Menu,
  X,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

export default function LandingPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  // Handle PWA installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  // Redirect authenticated users to their dashboards
  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.user_type === "customer") {
        router.push("/customer/dashboard")
      } else if (profile.user_type === "collector") {
        router.push("/collector/dashboard")
      }
    }
  }, [user, profile, loading, router])

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShowInstallPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Install App Prompt */}
      {showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 bg-green-600 text-white p-3 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              <span className="text-sm font-medium">Install aplikasi untuk pengalaman yang lebih baik</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleInstallApp}>
                Install
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowInstallPrompt(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b z-40 ${showInstallPrompt ? "mt-12" : ""}`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-2 rounded-lg">
                <Recycle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Kardus Collector</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection("beranda")} className="text-gray-600 hover:text-green-600">
                Beranda
              </button>
              <button onClick={() => scrollToSection("cara-kerja")} className="text-gray-600 hover:text-green-600">
                Cara Kerja
              </button>
              <button onClick={() => scrollToSection("testimoni")} className="text-gray-600 hover:text-green-600">
                Testimoni
              </button>
              <button onClick={() => scrollToSection("tentang")} className="text-gray-600 hover:text-green-600">
                Tentang
              </button>
              <button onClick={() => scrollToSection("kontak")} className="text-gray-600 hover:text-green-600">
                Kontak
              </button>
              <Link href="/auth/login">
                <Button variant="outline">Masuk</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Daftar</Button>
              </Link>
            </div>

            {/* Mobile Navigation Toggle */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button
                  onClick={() => scrollToSection("beranda")}
                  className="block px-3 py-2 text-gray-600 hover:text-green-600"
                >
                  Beranda
                </button>
                <button
                  onClick={() => scrollToSection("cara-kerja")}
                  className="block px-3 py-2 text-gray-600 hover:text-green-600"
                >
                  Cara Kerja
                </button>
                <button
                  onClick={() => scrollToSection("testimoni")}
                  className="block px-3 py-2 text-gray-600 hover:text-green-600"
                >
                  Testimoni
                </button>
                <button
                  onClick={() => scrollToSection("tentang")}
                  className="block px-3 py-2 text-gray-600 hover:text-green-600"
                >
                  Tentang
                </button>
                <button
                  onClick={() => scrollToSection("kontak")}
                  className="block px-3 py-2 text-gray-600 hover:text-green-600"
                >
                  Kontak
                </button>
                <div className="flex gap-2 px-3 py-2">
                  <Link href="/auth/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="flex-1">
                    <Button className="w-full">Daftar</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="beranda"
        className={`pt-24 pb-16 bg-gradient-to-br from-green-50 to-blue-50 ${showInstallPrompt ? "mt-12" : ""}`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">Platform Digital Terdepan</Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Jual Beli Kardus Bekas
                <span className="text-green-600"> Mudah & Menguntungkan</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Platform digital yang menghubungkan penjual kardus bekas dengan pengepul. Dapatkan harga terbaik, pickup
                terjadwal, dan transaksi yang aman.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Mulai Sekarang
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection("cara-kerja")}
                  className="w-full sm:w-auto"
                >
                  Pelajari Cara Kerja
                </Button>
              </div>

              {/* App Installation CTA */}
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Akses Mobile</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Install aplikasi untuk pengalaman yang lebih baik di perangkat mobile Anda
                </p>
                {showInstallPrompt ? (
                  <Button size="sm" onClick={handleInstallApp} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Install Aplikasi
                  </Button>
                ) : (
                  <p className="text-xs text-gray-500">Buka di browser mobile untuk opsi instalasi</p>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="bg-green-100 p-3 rounded-lg mb-2">
                      <TrendingUp className="h-6 w-6 text-green-600 mx-auto" />
                    </div>
                    <p className="text-sm font-medium">Harga Real-time</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-lg mb-2">
                      <Truck className="h-6 w-6 text-blue-600 mx-auto" />
                    </div>
                    <p className="text-sm font-medium">Pickup Terjadwal</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-yellow-100 p-3 rounded-lg mb-2">
                      <MapPin className="h-6 w-6 text-yellow-600 mx-auto" />
                    </div>
                    <p className="text-sm font-medium">Peta Interaktif</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 p-3 rounded-lg mb-2">
                      <Shield className="h-6 w-6 text-purple-600 mx-auto" />
                    </div>
                    <p className="text-sm font-medium">Transaksi Aman</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">Rp 2,500/kg</p>
                  <p className="text-sm text-gray-600">Harga kardus tebal hari ini</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="cara-kerja" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Cara Kerja Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proses yang sederhana dan efisien untuk semua pihak
            </p>
          </div>

          {/* For Customers */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-green-600">Untuk Penjual Kardus</h3>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <h4 className="font-semibold mb-2">Daftar & Login</h4>
                <p className="text-gray-600 text-sm">Buat akun sebagai penjual kardus dengan mudah</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h4 className="font-semibold mb-2">Submit Kardus</h4>
                <p className="text-gray-600 text-sm">Upload foto dan detail kardus yang ingin dijual</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h4 className="font-semibold mb-2">Jadwal Pickup</h4>
                <p className="text-gray-600 text-sm">Pengepul akan menjadwalkan waktu pickup</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">4</span>
                </div>
                <h4 className="font-semibold mb-2">Terima Pembayaran</h4>
                <p className="text-gray-600 text-sm">Dapatkan pembayaran setelah pickup selesai</p>
              </div>
            </div>
          </div>

          {/* For Collectors */}
          <div>
            <h3 className="text-2xl font-bold text-center mb-8 text-blue-600">Untuk Pengepul</h3>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold mb-2">Daftar & Verifikasi</h4>
                <p className="text-gray-600 text-sm">Daftar sebagai pengepul dan lengkapi profil</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h4 className="font-semibold mb-2">Set Harga</h4>
                <p className="text-gray-600 text-sm">Tentukan harga untuk berbagai jenis kardus</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h4 className="font-semibold mb-2">Kelola Pickup</h4>
                <p className="text-gray-600 text-sm">Lihat pengajuan dan atur jadwal pickup optimal</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">4</span>
                </div>
                <h4 className="font-semibold mb-2">Proses Transaksi</h4>
                <p className="text-gray-600 text-sm">Lakukan pickup dan proses pembayaran</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Fitur Unggulan</h2>
            <p className="text-xl text-gray-600">Teknologi terdepan untuk kemudahan transaksi</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Harga Real-time</CardTitle>
                <CardDescription>Harga kardus yang selalu update sesuai kondisi pasar terkini</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Peta Interaktif</CardTitle>
                <CardDescription>Lihat lokasi pengepul terdekat dan rute optimal untuk pickup</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Jadwal Fleksibel</CardTitle>
                <CardDescription>Atur jadwal pickup sesuai dengan waktu yang Anda inginkan</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Transaksi Aman</CardTitle>
                <CardDescription>Sistem pembayaran yang aman dengan jaminan kepuasan</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-12 w-12 text-yellow-600 mb-4" />
                <CardTitle>Progressive Web App</CardTitle>
                <CardDescription>Akses mudah di semua perangkat dengan performa aplikasi native</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Komunitas Aktif</CardTitle>
                <CardDescription>Bergabung dengan komunitas pengepul dan penjual kardus</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Testimoni Pengguna</h2>
            <p className="text-xl text-gray-600">Apa kata mereka yang sudah menggunakan platform kami</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Platform ini sangat membantu toko saya. Sekarang saya bisa jual kardus bekas dengan harga yang adil
                  dan pickup yang tepat waktu."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-semibold">AS</span>
                  </div>
                  <div>
                    <p className="font-semibold">Ahmad Santoso</p>
                    <p className="text-sm text-gray-600">Pemilik Toko ABC</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Sebagai pengepul, aplikasi ini memudahkan saya mengatur rute dan mengelola pelanggan. Fitur peta
                  interaktifnya sangat membantu."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">BP</span>
                  </div>
                  <div>
                    <p className="font-semibold">Budi Prasetyo</p>
                    <p className="text-sm text-gray-600">Pengepul Kardus</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Transaksi jadi lebih transparan dan aman. Saya bisa lihat harga real-time dan tidak khawatir ditipu
                  lagi."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-semibold">SR</span>
                  </div>
                  <div>
                    <p className="font-semibold">Siti Rahayu</p>
                    <p className="text-sm text-gray-600">Pemilik Warung</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="tentang" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Tentang Kardus Collector</h2>
              <p className="text-lg text-gray-600 mb-6">
                Kardus Collector adalah platform digital yang menghubungkan penjual kardus bekas dengan pengepul di
                seluruh Indonesia. Kami berkomitmen untuk menciptakan ekosistem daur ulang yang efisien dan
                menguntungkan bagi semua pihak.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Dengan teknologi terdepan dan fokus pada pengalaman pengguna, kami membantu mengurangi limbah kardus
                sambil memberikan nilai ekonomi yang adil kepada masyarakat.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">1000+</p>
                  <p className="text-gray-600">Pengguna Aktif</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">50+</p>
                  <p className="text-gray-600">Pengepul Terdaftar</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">10 Ton</p>
                  <p className="text-gray-600">Kardus Terdaur Ulang</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">15 Kota</p>
                  <p className="text-gray-600">Area Layanan</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-xl font-semibold">Misi Kami</h3>
                  </div>
                  <p className="text-gray-600">
                    Menciptakan platform yang memudahkan daur ulang kardus bekas dengan teknologi digital, memberikan
                    nilai ekonomi yang adil, dan berkontribusi pada lingkungan yang lebih bersih.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold">Visi Kami</h3>
                  </div>
                  <p className="text-gray-600">
                    Menjadi platform terdepan dalam industri daur ulang kardus di Indonesia, menghubungkan jutaan
                    pengguna dalam ekosistem ekonomi sirkular yang berkelanjutan.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-xl text-gray-600">Temukan jawaban untuk pertanyaan umum tentang platform kami</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Bagaimana cara menentukan harga kardus?</h3>
                <p className="text-gray-600">
                  Harga kardus ditentukan berdasarkan jenis, kondisi, dan berat kardus. Pengepul akan memberikan harga
                  real-time yang kompetitif sesuai dengan kondisi pasar saat ini.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Apakah ada biaya untuk menggunakan platform ini?</h3>
                <p className="text-gray-600">
                  Platform ini gratis untuk digunakan oleh penjual kardus. Pengepul membayar biaya layanan yang sangat
                  terjangkau untuk mengakses fitur-fitur premium.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Bagaimana sistem pembayaran bekerja?</h3>
                <p className="text-gray-600">
                  Pembayaran dilakukan secara langsung antara penjual dan pengepul saat pickup. Platform menyediakan
                  sistem tracking untuk memastikan transparansi transaksi.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Berapa berat minimum kardus yang bisa dijual?</h3>
                <p className="text-gray-600">
                  Berat minimum kardus yang bisa dijual adalah 10 kg. Hal ini untuk memastikan efisiensi pickup dan
                  memberikan nilai yang layak bagi semua pihak.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Bagaimana jika ada masalah dengan pickup?</h3>
                <p className="text-gray-600">
                  Tim customer service kami siap membantu 24/7. Anda bisa menghubungi kami melalui chat, email, atau
                  telepon untuk menyelesaikan masalah dengan cepat.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Apakah aplikasi ini tersedia untuk semua perangkat?</h3>
                <p className="text-gray-600">
                  Ya, aplikasi ini adalah Progressive Web App (PWA) yang dapat diakses melalui browser di semua
                  perangkat dan dapat diinstall seperti aplikasi native.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="kontak" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Hubungi Kami</h2>
            <p className="text-xl text-gray-600">Ada pertanyaan? Tim kami siap membantu Anda</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Informasi Kontak</h3>

              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Telepon</p>
                    <p className="text-gray-600">+62 21 1234 5678</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-gray-600">info@karduscollector.com</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Alamat</p>
                    <p className="text-gray-600">
                      Jl. Sudirman No. 123
                      <br />
                      Jakarta Pusat 10110
                      <br />
                      Indonesia
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Jam Operasional</h4>
                <div className="space-y-2 text-gray-600">
                  <p>Senin - Jumat: 08:00 - 17:00 WIB</p>
                  <p>Sabtu: 08:00 - 12:00 WIB</p>
                  <p>Minggu: Tutup</p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Kirim Pesan</CardTitle>
                <CardDescription>Isi form di bawah ini dan kami akan segera menghubungi Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nama Depan</label>
                      <Input placeholder="John" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nama Belakang</label>
                      <Input placeholder="Doe" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="john@example.com" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subjek</label>
                    <Input placeholder="Pertanyaan tentang platform" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pesan</label>
                    <Textarea placeholder="Tulis pesan Anda di sini..." className="mt-1" rows={4} />
                  </div>
                  <Button className="w-full">Kirim Pesan</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Policy */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Kebijakan Privasi</h2>
            <p className="text-xl text-gray-600">Komitmen kami dalam melindungi data dan privasi Anda</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Pengumpulan Data</h3>
                <p className="text-gray-600 mb-6">
                  Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti nama, email, nomor telepon, dan
                  alamat saat Anda mendaftar atau menggunakan layanan kami. Data ini diperlukan untuk memberikan layanan
                  terbaik kepada Anda.
                </p>

                <h3 className="text-xl font-semibold mb-4">Penggunaan Data</h3>
                <p className="text-gray-600 mb-6">Data yang kami kumpulkan digunakan untuk:</p>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Memproses transaksi dan pickup kardus</li>
                  <li>Mengirimkan notifikasi terkait layanan</li>
                  <li>Meningkatkan kualitas platform</li>
                  <li>Memberikan dukungan pelanggan</li>
                  <li>Mematuhi kewajiban hukum</li>
                </ul>

                <h3 className="text-xl font-semibold mb-4">Keamanan Data</h3>
                <p className="text-gray-600 mb-6">
                  Kami menggunakan enkripsi SSL dan langkah-langkah keamanan industri standar untuk melindungi informasi
                  pribadi Anda. Data disimpan di server yang aman dan hanya dapat diakses oleh personel yang berwenang.
                </p>

                <h3 className="text-xl font-semibold mb-4">Berbagi Data</h3>
                <p className="text-gray-600 mb-6">
                  Kami tidak akan menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga tanpa
                  persetujuan Anda, kecuali dalam situasi berikut:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>Untuk memfasilitasi transaksi antara penjual dan pengepul</li>
                  <li>Ketika diwajibkan oleh hukum</li>
                  <li>Untuk melindungi hak dan keamanan platform</li>
                </ul>

                <h3 className="text-xl font-semibold mb-4">Hak Anda</h3>
                <p className="text-gray-600 mb-6">
                  Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda. Anda juga dapat
                  meminta kami untuk membatasi pemrosesan data Anda atau menarik persetujuan yang telah diberikan.
                </p>

                <h3 className="text-xl font-semibold mb-4">Kontak</h3>
                <p className="text-gray-600">
                  Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di
                  privacy@karduscollector.com atau melalui informasi kontak yang tersedia di website ini.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Siap Memulai Perjalanan Anda?</h2>
          <p className="text-xl mb-8 opacity-90">
            Bergabunglah dengan ribuan pengguna yang sudah merasakan kemudahan platform kami
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Daftar Sekarang
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-green-600"
              >
                Masuk ke Akun
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Recycle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Kardus Collector</span>
              </div>
              <p className="text-gray-400 mb-4">Platform digital terdepan untuk jual beli kardus bekas di Indonesia.</p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xs">FB</span>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xs">IG</span>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xs">TW</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button onClick={() => scrollToSection("cara-kerja")}>Cara Kerja</button>
                </li>
                <li>
                  <Link href="/auth/register">Daftar</Link>
                </li>
                <li>
                  <Link href="/auth/login">Masuk</Link>
                </li>
                <li>
                  <button onClick={() => scrollToSection("tentang")}>Tentang Kami</button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Dukungan</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button onClick={() => scrollToSection("kontak")}>Hubungi Kami</button>
                </li>
                <li>
                  <a href="#faq">FAQ</a>
                </li>
                <li>
                  <a href="#privacy">Kebijakan Privasi</a>
                </li>
                <li>
                  <a href="#terms">Syarat & Ketentuan</a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Kontak</h3>
              <ul className="space-y-2 text-gray-400">
                <li>+62 21 1234 5678</li>
                <li>info@karduscollector.com</li>
                <li>
                  Jl. Sudirman No. 123
                  <br />
                  Jakarta Pusat 10110
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Kardus Collector. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
