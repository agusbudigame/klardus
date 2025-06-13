"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNavigation } from "@/components/bottom-navigation"
import { TrendingUp, ArrowLeft, Bell, RefreshCw, Calculator } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/supabase"
import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription"
import type { Database } from "@/types/supabase"
import Link from "next/link"

type CardboardPrice = Database["public"]["Tables"]["cardboard_prices"]["Row"]
type PriceHistory = Database["public"]["Tables"]["price_history"]["Row"]

interface PriceWithHistory extends CardboardPrice {
  price_history?: PriceHistory[]
}

export default function CustomerPrices() {
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  const [prices, setPrices] = useState<PriceWithHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Calculator state
  const [calculator, setCalculator] = useState({
    type: "",
    condition: "",
    weight: "",
    estimatedPrice: 0,
  })

  // Fetch prices on component mount
  useEffect(() => {
    fetchPrices()
  }, [])

  // Subscribe to price changes
  useSupabaseSubscription({
    table: "cardboard_prices",
    onUpdate: (payload) => {
      console.log("Price updated:", payload)
      fetchPrices() // Refresh prices when updated
    },
    onInsert: (payload) => {
      console.log("New price added:", payload)
      fetchPrices()
    },
  })

  const fetchPrices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("cardboard_prices")
        .select(`
          *,
          price_history (
            id,
            old_price,
            new_price,
            created_at
          )
        `)
        .eq("is_active", true)
        .order("type", { ascending: true })
        .order("condition", { ascending: false })

      if (error) throw error

      setPrices(data || [])
    } catch (error) {
      console.error("Error fetching prices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPrices()
    setRefreshing(false)
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

  const getTrendIcon = (priceHistory: PriceHistory[] = []) => {
    if (priceHistory.length === 0) return "➡️"

    const latest = priceHistory[0]
    if (latest.new_price && latest.old_price) {
      if (latest.new_price > latest.old_price) return "📈"
      if (latest.new_price < latest.old_price) return "📉"
    }
    return "➡️"
  }

  const getTrendColor = (priceHistory: PriceHistory[] = []) => {
    if (priceHistory.length === 0) return "text-gray-600"

    const latest = priceHistory[0]
    if (latest.new_price && latest.old_price) {
      if (latest.new_price > latest.old_price) return "text-green-600"
      if (latest.new_price < latest.old_price) return "text-red-600"
    }
    return "text-gray-600"
  }

  const calculatePrice = () => {
    const selectedPrice = prices.find((p) => p.type === calculator.type && p.condition === calculator.condition)
    const weight = Number.parseFloat(calculator.weight)

    if (selectedPrice && weight >= 10) {
      const estimatedPrice = selectedPrice.price_per_kg * weight
      setCalculator((prev) => ({ ...prev, estimatedPrice }))
    } else {
      setCalculator((prev) => ({ ...prev, estimatedPrice: 0 }))
    }
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

  // Group prices by type
  const groupedPrices = prices.reduce(
    (acc, price) => {
      if (!acc[price.type]) {
        acc[price.type] = []
      }
      acc[price.type].push(price)
      return acc
    },
    {} as Record<string, PriceWithHistory[]>,
  )

  const uniqueTypes = Array.from(new Set(prices.map((p) => p.type)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat harga...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/customer/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Harga Kardus</h1>
              <p className="text-sm text-gray-600">Update real-time</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className={refreshing ? "animate-spin" : ""}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Price Update Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Update Harga Real-time</span>
            </div>
            <p className="text-sm text-blue-700">Harga diperbarui secara otomatis oleh pengepul</p>
            {prices.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">Terakhir update: {formatDate(prices[0].updated_at)}</p>
            )}
          </CardContent>
        </Card>

        {/* Price Cards */}
        {Object.entries(groupedPrices).map(([type, typePrices]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{type}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${getTrendColor(typePrices[0]?.price_history)}`}>
                    {getTrendIcon(typePrices[0]?.price_history)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    per kg
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typePrices.map((price) => (
                  <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{getConditionLabel(price.condition)}</p>
                      <p className="text-sm text-gray-600">Kondisi {price.condition}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(price.price_per_kg)}</p>
                      <p className="text-xs text-gray-600">per kg</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-gray-500">Update terakhir: {formatDate(typePrices[0].updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Price Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Kalkulator Harga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Jenis Kardus</Label>
                  <Select
                    value={calculator.type}
                    onValueChange={(value) => {
                      setCalculator((prev) => ({ ...prev, type: value }))
                      setTimeout(calculatePrice, 100)
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Kondisi</Label>
                  <Select
                    value={calculator.condition}
                    onValueChange={(value) => {
                      setCalculator((prev) => ({ ...prev, condition: value }))
                      setTimeout(calculatePrice, 100)
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih kondisi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Sangat Baik</SelectItem>
                      <SelectItem value="good">Baik</SelectItem>
                      <SelectItem value="fair">Cukup</SelectItem>
                      <SelectItem value="poor">Rusak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Berat (kg)</Label>
                <Input
                  type="number"
                  placeholder="Masukkan berat (min. 10kg)"
                  className="mt-1"
                  min="10"
                  value={calculator.weight}
                  onChange={(e) => {
                    setCalculator((prev) => ({ ...prev, weight: e.target.value }))
                    setTimeout(calculatePrice, 100)
                  }}
                />
              </div>

              {calculator.estimatedPrice > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Estimasi Harga</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(calculator.estimatedPrice)}</p>
                  <p className="text-sm text-green-700">*Harga dapat berubah saat pickup</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {prices.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Harga</h3>
              <p className="text-gray-600 mb-4">Harga kardus akan muncul setelah pengepul mengatur harga mereka.</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation userType="customer" />
    </div>
  )
}
