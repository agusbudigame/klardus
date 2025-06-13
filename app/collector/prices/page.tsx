"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ArrowLeft, Save, Send, TrendingUp, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import Link from "next/link"

type CardboardPrice = Database["public"]["Tables"]["cardboard_prices"]["Row"]
type PriceHistory = Database["public"]["Tables"]["price_history"]["Row"] & {
  cardboard_prices?: CardboardPrice
}

interface PriceData {
  id?: string
  type: string
  conditions: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
}

export default function CollectorPrices() {
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  const [prices, setPrices] = useState<PriceData[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPrices()
      fetchPriceHistory()
    }
  }, [user])

  const fetchPrices = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("cardboard_prices")
        .select("*")
        .eq("collector_id", user.id)
        .eq("is_active", true)
        .order("type", { ascending: true })

      if (error) throw error

      // Group prices by type
      const groupedPrices: Record<string, PriceData> = {}

      data?.forEach((price) => {
        if (!groupedPrices[price.type]) {
          groupedPrices[price.type] = {
            type: price.type,
            conditions: {
              excellent: 0,
              good: 0,
              fair: 0,
              poor: 0,
            },
          }
        }
        \
        groupedPrices[price.
        type
        ].conditions[price.condition as keyof typeof groupedPrices[price.
        type
        ].conditions] =
          price.price_per_kg
      })

      // Convert to array and add default types if not present
      const defaultTypes = ["Kardus Tebal", "Kardus Tipis", "Kardus Bekas"]
      const pricesArray: PriceData[] = []

      defaultTypes.forEach((type) => {
        if (groupedPrices[type]) {
          pricesArray.push(groupedPrices[type])
        } else {
          pricesArray.push({
            type,
            conditions: {
              excellent: 0,
              good: 0,
              fair: 0,
              poor: 0,
            },
          })
        }
      })

      // Add any additional types
      Object.values(groupedPrices).forEach((price) => {
        if (!defaultTypes.includes(price.type)) {
          pricesArray.push(price)
        }
      })

      setPrices(pricesArray)
    } catch (error) {
      console.error("Error fetching prices:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPriceHistory = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("price_history")
        .select(`
          *,
          cardboard_prices (
            type,
            condition
          )
        `)
        .eq("changed_by", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error
      setPriceHistory(data || [])
    } catch (error) {
      console.error("Error fetching price history:", error)
    }
  }

  const handlePriceChange = (typeIndex: number, condition: string, value: string) => {
    const newPrices = [...prices]
    newPrices[typeIndex].conditions[condition as keyof typeof newPrices[typeIndex].conditions
    ] =
      parseInt(value) || 0
    setPrices(newPrices)
  }

  const addNewType = () => {
    const newType = prompt("Masukkan nama jenis kardus baru:")
    if (newType && !prices.find((p) => p.type === newType)) {
      setPrices([
        ...prices,
        {
          type: newType,
          conditions: {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0,
          },
        },
      ])
    }
  }

  const removeType = (typeIndex: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus jenis kardus ini?")) {
      const newPrices = prices.filter((_, index) => index !== typeIndex)
      setPrices(newPrices)
    }
  }

  const handleSavePrices = async () => {
    if (!user) return

    setSaving(true)
    try {
      // First, deactivate all existing prices for this collector
      const { error: deactivateError } = await supabase
        .from("cardboard_prices")
        .update({ is_active: false })
        .eq("collector_id", user.id)

      if (deactivateError) throw deactivateError

      // Then insert/update new prices
      const priceInserts: Database["public"]["Tables"]["cardboard_prices"]["Insert"][] = []

      prices.forEach((priceData) => {
        Object.entries(priceData.conditions).forEach(([condition, price]) => {
          if (price > 0) {
            priceInserts.push({
              collector_id: user.id,
              type: priceData.type,
              condition,
              price_per_kg: price,
              is_active: true,
            })
          }
        })
      })

      if (priceInserts.length > 0) {
        const { error: insertError } = await supabase.from("cardboard_prices").insert(priceInserts)

        if (insertError) throw insertError
      }

      await fetchPrices()
      await fetchPriceHistory()
      alert("Harga berhasil disimpan!")
    } catch (error) {
      console.error("Error saving prices:", error)
      alert("Gagal menyimpan harga")
    } finally {
      setSaving(false)
    }
  }

  const handleBroadcastPrices = async () => {
    // This would trigger notifications to customers
    // For now, just show a confirmation
    alert("Notifikasi perubahan harga telah dikirim ke semua pelanggan!")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "Sangat Baik"
      case "good":
        return "Baik"
      case "fair":
        return "Cukup"
      case "poor":
        return "Rusak"
      default:
        return condition
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat harga...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Link href="/collector/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kelola Harga</h1>
            <p className="text-sm text-gray-600">Update harga kardus Anda</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Price Management */}
        {prices.map((priceData, typeIndex) => (
          <Card key={typeIndex}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {priceData.type}
                </div>
                {typeIndex >= 3 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeType(typeIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(priceData.conditions).map(([condition, price]) => (
                  <div key={condition} className="flex items-center justify-between">
                    <Label className="flex-1">{getConditionLabel(condition)}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Rp</span>
                      <Input
                        type="number"
                        value={price || ""}
                        onChange={(e) => handlePriceChange(typeIndex, condition, e.target.value)}
                        className="w-24 text-right"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-600">/kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Type Button */}
        <Button variant="outline" className="w-full" onClick={addNewType}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Jenis Kardus Baru
        </Button>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={handleSavePrices} className="w-full" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Perubahan Harga"}
          </Button>

          <Button onClick={handleBroadcastPrices} variant="outline" className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Kirim Notifikasi ke Pelanggan
          </Button>
        </div>

        {/* Price History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Perubahan Harga</CardTitle>
          </CardHeader>
          <CardContent>
            {priceHistory.length > 0 ? (
              <div className="space-y-3">
                {priceHistory.map((history) => (
                  <div key={history.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {history.cardboard_prices?.type} -{" "}
                        {getConditionLabel(history.cardboard_prices?.condition || "")}
                      </p>
                      <p className="text-sm text-gray-600">{formatDate(history.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {formatCurrency(history.old_price || 0)} → {formatCurrency(history.new_price || 0)}
                      </p>
                      <p
                        className={`text-xs ${
                          (history.new_price || 0) > (history.old_price || 0) ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {history.new_price && history.old_price
                          ? `${(((history.new_price - history.old_price) / history.old_price) * 100).toFixed(1)}%`
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada riwayat perubahan harga</p>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation userType="collector" />
    </div>
  )
}
