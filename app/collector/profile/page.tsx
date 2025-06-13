"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Camera,
  Lock,
  Settings,
  LogOut,
  Edit,
  Save,
  ChevronRight,
  Moon,
  Languages,
  Volume2,
  MapPin,
  Phone,
  Mail,
  Truck,
  Fuel,
} from "lucide-react"

interface CollectorProfile {
  name: string
  email: string
  phone: string
  address: string
  operationalArea: string
  avatar: string
  bio: string
  vehicleType: string
  vehicleNumber: string
}

export default function CollectorProfile() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)

  const [profile, setProfile] = useState<CollectorProfile>({
    name: "Budi Pengepul",
    email: "budi@example.com",
    phone: "081234567890",
    address: "Jl. Gatot Subroto No. 45, Jakarta",
    operationalArea: "Jakarta Selatan, Jakarta Pusat",
    avatar: "",
    bio: "Pengepul kardus bekas dengan pengalaman 5 tahun. Melayani area Jakarta dan sekitarnya.",
    vehicleType: "Pickup Truck",
    vehicleNumber: "B 1234 CD",
  })

  const [settings, setSettings] = useState({
    darkMode: false,
    language: "id",
    notifications: {
      newSubmissions: true,
      scheduledPickups: true,
      priceAlerts: true,
      systemUpdates: false,
    },
    sound: true,
    vibration: true,
    locationTracking: true,
    routeOptimization: true,
    autoRefreshMap: true,
  })

  const handleProfileChange = (field: keyof CollectorProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSettingChange = (field: string, value: boolean) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setSettings((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }))
    } else {
      setSettings((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSaveProfile = () => {
    // In a real app, this would save to backend
    localStorage.setItem("collector_profile", JSON.stringify(profile))
    setIsEditing(false)
    alert("Profil berhasil disimpan!")
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleAvatarUpload = () => {
    // In a real app, this would open file picker
    alert("Fitur upload foto akan segera tersedia!")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Profil Pengepul</h1>
            <p className="text-green-100">Kelola informasi akun Anda</p>
          </div>
          {activeTab === "profile" && !isEditing ? (
            <Button
              variant="outline"
              size="sm"
              className="text-white border-white hover:bg-green-700"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : activeTab === "profile" && isEditing ? (
            <Button size="sm" className="bg-white text-green-600 hover:bg-green-50" onClick={handleSaveProfile}>
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </Button>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              Keamanan
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Pengaturan
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {/* Avatar Section */}
            <Card>
              <CardContent className="p-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar || "/placeholder.svg?height=96&width=96"} alt={profile.name} />
                    <AvatarFallback className="bg-green-600 text-white">{profile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    onClick={handleAvatarUpload}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-sm text-gray-600">{profile.email}</p>
                <p className="text-sm text-gray-600 mt-1">Pengepul</p>
              </CardContent>
            </Card>

            {/* Profile Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleProfileChange("name", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-gray-800 p-2 bg-gray-50 rounded-md">{profile.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange("email", e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-800 p-2 bg-gray-50 rounded-md">
                      <Mail className="h-4 w-4 text-gray-500" />
                      {profile.email}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-800 p-2 bg-gray-50 rounded-md">
                      <Phone className="h-4 w-4 text-gray-500" />
                      {profile.phone}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  {isEditing ? (
                    <Textarea
                      id="address"
                      value={profile.address}
                      onChange={(e) => handleProfileChange("address", e.target.value)}
                    />
                  ) : (
                    <div className="flex items-start gap-2 text-sm text-gray-800 p-2 bg-gray-50 rounded-md">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      {profile.address}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operationalArea">Area Operasional</Label>
                  {isEditing ? (
                    <Input
                      id="operationalArea"
                      value={profile.operationalArea}
                      onChange={(e) => handleProfileChange("operationalArea", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-gray-800 p-2 bg-gray-50 rounded-md">{profile.operationalArea}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => handleProfileChange("bio", e.target.value)}
                      placeholder="Ceritakan tentang bisnis pengepulan Anda"
                    />
                  ) : (
                    <p className="text-sm text-gray-800 p-2 bg-gray-50 rounded-md">{profile.bio}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Kendaraan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Jenis Kendaraan</Label>
                  {isEditing ? (
                    <Input
                      id="vehicleType"
                      value={profile.vehicleType}
                      onChange={(e) => handleProfileChange("vehicleType", e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-800 p-2 bg-gray-50 rounded-md">
                      <Truck className="h-4 w-4 text-gray-500" />
                      {profile.vehicleType}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Nomor Kendaraan</Label>
                  {isEditing ? (
                    <Input
                      id="vehicleNumber"
                      value={profile.vehicleNumber}
                      onChange={(e) => handleProfileChange("vehicleNumber", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-gray-800 p-2 bg-gray-50 rounded-md">{profile.vehicleNumber}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Logout Button */}
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ubah Password</CardTitle>
                <CardDescription>Pastikan password Anda kuat dan unik</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Password Saat Ini</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password Baru</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">Ubah Password</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keamanan Akun</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Verifikasi 2 Langkah</p>
                    <p className="text-sm text-gray-600">Tingkatkan keamanan akun Anda</p>
                  </div>
                  <Button variant="outline">Aktifkan</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sesi Aktif</p>
                    <p className="text-sm text-gray-600">Kelola perangkat yang login</p>
                  </div>
                  <Button variant="outline">Lihat</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pengaturan Aplikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <p className="font-medium">Mode Gelap</p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    <p className="font-medium">Bahasa</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Indonesia</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notifikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pengajuan Baru</p>
                    <p className="text-sm text-gray-600">Notifikasi pengajuan kardus baru</p>
                  </div>
                  <Switch
                    checked={settings.notifications.newSubmissions}
                    onCheckedChange={(checked) => handleSettingChange("notifications.newSubmissions", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Jadwal Pickup</p>
                    <p className="text-sm text-gray-600">Pengingat jadwal pickup</p>
                  </div>
                  <Switch
                    checked={settings.notifications.scheduledPickups}
                    onCheckedChange={(checked) => handleSettingChange("notifications.scheduledPickups", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alert Harga</p>
                    <p className="text-sm text-gray-600">Notifikasi perubahan harga pasar</p>
                  </div>
                  <Switch
                    checked={settings.notifications.priceAlerts}
                    onCheckedChange={(checked) => handleSettingChange("notifications.priceAlerts", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Update Sistem</p>
                    <p className="text-sm text-gray-600">Notifikasi pembaruan aplikasi</p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemUpdates}
                    onCheckedChange={(checked) => handleSettingChange("notifications.systemUpdates", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pengaturan Operasional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <p className="font-medium">Suara Notifikasi</p>
                  </div>
                  <Switch
                    checked={settings.sound}
                    onCheckedChange={(checked) => handleSettingChange("sound", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Getar</p>
                    <p className="text-sm text-gray-600">Getaran saat notifikasi</p>
                  </div>
                  <Switch
                    checked={settings.vibration}
                    onCheckedChange={(checked) => handleSettingChange("vibration", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pelacakan Lokasi</p>
                    <p className="text-sm text-gray-600">Izinkan akses lokasi</p>
                  </div>
                  <Switch
                    checked={settings.locationTracking}
                    onCheckedChange={(checked) => handleSettingChange("locationTracking", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Optimasi Rute</p>
                    <p className="text-sm text-gray-600">Hitung rute optimal otomatis</p>
                  </div>
                  <Switch
                    checked={settings.routeOptimization}
                    onCheckedChange={(checked) => handleSettingChange("routeOptimization", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-refresh Peta</p>
                    <p className="text-sm text-gray-600">Perbarui peta secara otomatis</p>
                  </div>
                  <Switch
                    checked={settings.autoRefreshMap}
                    onCheckedChange={(checked) => handleSettingChange("autoRefreshMap", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pengaturan Kendaraan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    <p className="font-medium">Konsumsi BBM</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">10 km/liter</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Kapasitas Maksimal</p>
                    <p className="text-sm text-gray-600">Berat maksimal kendaraan</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">500 kg</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tentang Aplikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Versi Aplikasi</p>
                  <p className="text-sm text-gray-600">1.0.0</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Syarat & Ketentuan</p>
                  <ChevronRight className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Kebijakan Privasi</p>
                  <ChevronRight className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Bantuan & Dukungan</p>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation userType="collector" />
    </div>
  )
}
