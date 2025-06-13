"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNavigation } from "@/components/bottom-navigation"
import { MapPin, Camera, ArrowLeft, Calculator } from "lucide-react"
import Link from "next/link"

export default function SellCardboard() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    type: "",
    weight: "",
    condition: "",
    address: "",
    pickupDate: "",
    pickupTime: "",
    notes: "",
    photos: [] as File[],
  })

  const [estimatedPrice, setEstimatedPrice] = useState(0)

  const cardboardTypes = [
    { value: "thick", label: "Kardus Tebal", price: 2500 },
    { value: "thin", label: "Kardus Tipis", price: 2000 },
    { value: "used", label: "Kardus Bekas", price: 1800 },
  ]

  const conditions = [
    { value: "excellent", label: "Sangat Baik", multiplier: 1.0 },
    { value: "good", label: "Baik", multiplier: 0.9 },
    { value: "fair", label: "Cukup", multiplier: 0.8 },
    { value: "poor", label: "Rusak", multiplier: 0.7 },
  ]

  const calculateEstimatedPrice = () => {
    const type = cardboardTypes.find((t) => t.value === formData.type)
    const condition = conditions.find((c) => c.value === formData.condition)
    const weight = Number.parseFloat(formData.weight)

    if (type && condition && weight >= 10) {
      const price = type.price * condition.multiplier * weight
      setEstimatedPrice(Math.round(price))
    } else {
      setEstimatedPrice(0)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (Number.parseFloat(formData.weight) < 10) {
      alert("Berat minimum adalah 10 kg")
      return
    }

    // Save to localStorage (in real app, this would be sent to backend)
    const submission = {
      id: Date.now().toString(),
      ...formData,
      estimatedPrice,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    const existingSubmissions = JSON.parse(localStorage.getItem("cardboard_submissions") || "[]")
    existingSubmissions.push(submission)
    localStorage.setItem("cardboard_submissions", JSON.stringify(existingSubmissions))

    alert("Pengajuan penjualan berhasil dikirim!")
    router.push("/customer/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Link href="/customer/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Jual Kardus</h1>
            <p className="text-sm text-gray-600">Minimum 10 kg</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Cardboard Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Kardus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Jenis Kardus</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value })
                  setTimeout(calculateEstimatedPrice, 100)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kardus" />
                </SelectTrigger>
                <SelectContent>
                  {cardboardTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} - Rp{type.price.toLocaleString()}/kg
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Berat (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="10"
                step="0.1"
                placeholder="Minimum 10 kg"
                value={formData.weight}
                onChange={(e) => {
                  setFormData({ ...formData, weight: e.target.value })
                  setTimeout(calculateEstimatedPrice, 100)
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Kondisi</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => {
                  setFormData({ ...formData, condition: value })
                  setTimeout(calculateEstimatedPrice, 100)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kondisi kardus" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {estimatedPrice > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Estimasi Harga</span>
                </div>
                <p className="text-2xl font-bold text-green-600">Rp{estimatedPrice.toLocaleString()}</p>
                <p className="text-sm text-green-700">*Harga dapat berubah saat pickup</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lokasi Pickup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea
                id="address"
                placeholder="Masukkan alamat lengkap untuk pickup"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <Button type="button" variant="outline" className="w-full">
              <MapPin className="h-4 w-4 mr-2" />
              Pilih Lokasi di Peta
            </Button>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jadwal Pickup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Tanggal</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupTime">Waktu</Label>
                <Input
                  id="pickupTime"
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Foto Kardus</CardTitle>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Ambil/Upload Foto
            </Button>
            <p className="text-sm text-gray-600 mt-2">Upload foto kardus untuk verifikasi</p>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catatan Tambahan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Catatan khusus untuk pengepul (opsional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="space-y-4">
          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={!formData.type || !formData.weight || Number.parseFloat(formData.weight) < 10}
          >
            Ajukan Penjualan
          </Button>

          <p className="text-xs text-gray-600 text-center">
            Dengan mengajukan penjualan, Anda menyetujui syarat dan ketentuan yang berlaku
          </p>
        </div>
      </form>

      <BottomNavigation userType="customer" />
    </div>
  )
}
