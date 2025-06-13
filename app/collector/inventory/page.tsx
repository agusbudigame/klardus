"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ArrowLeft, Package, TrendingUp, Calendar, Search, Filter, Plus, Truck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import Link from "next/link"

type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"]
type Transaction = Database["public"]["Tables"]["transactions"]["Row"]

interface InventoryStats {
  totalWeight: number
  totalValue: number
  uniqueTypes: number
  oldestItem: string
}

export default function CollectorInventory() {
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<InventoryStats>({
    totalWeight: 0,
    totalValue: 0,
    uniqueTypes: 0,
    oldestItem: "",
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [conditionFilter, setConditionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (user) {
      fetchInventory()
      fetchTransactions()
    }
  }, [user])

  useEffect(() => {
    filterInventory()
  }, [inventory, searchTerm, typeFilter, conditionFilter, statusFilter])

  const fetchInventory = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("collector_id", user.id)
        .order("acquired_date", { ascending: false })

      if (error) throw error

      setInventory(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error("Error fetching inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("collector_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }

  const calculateStats = (inventoryData: InventoryItem[]) => {
    const totalWeight = inventoryData.reduce((sum, item) => sum + item.weight, 0)

    // Calculate estimated value based on average transaction prices
    const totalValue = inventoryData.reduce((sum, item) => {
      const avgPrice = getAveragePrice(item.type, item.condition)
      return sum + item.weight * avgPrice
    }, 0)

    const uniqueTypes = new Set(inventoryData.map((item) => item.type)).size

    const oldestItem =
      inventoryData.length > 0
        ? inventoryData.reduce((oldest, item) =>
            new Date(item.acquired_date) < new Date(oldest.acquired_date) ? item : oldest,
          ).acquired_date
        : ""

    setStats({
      totalWeight,
      totalValue,
      uniqueTypes,
      oldestItem,
    })
  }

  const getAveragePrice = (type: string, condition: string) => {
    const relevantTransactions = transactions.filter((t) => t.type === type)

    if (relevantTransactions.length === 0) return 2000 // Default price

    const avgPrice = relevantTransactions.reduce((sum, t) => sum + t.price_per_kg, 0) / relevantTransactions.length

    // Adjust for condition
    const conditionMultiplier =
      {
        excellent: 1.0,
        good: 0.9,
        fair: 0.8,
        poor: 0.7,
      }[condition] || 0.8

    return avgPrice * conditionMultiplier
  }

  const filterInventory = () => {
    let filtered = inventory

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    if (conditionFilter !== "all") {
      filtered = filtered.filter((item) => item.condition === conditionFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    setFilteredInventory(filtered)
  }

  const updateInventoryFromTransactions = async () => {
    if (!user) return

    try {
      // Get recent transactions that haven't been added to inventory
      const recentTransactions = transactions.filter(
        (t) => new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      )

      for (const transaction of recentTransactions) {
        // Check if already in inventory
        const existingItem = inventory.find((item) => item.source === `Transaction ${transaction.id}`)

        if (!existingItem) {
          await supabase.from("inventory").insert({
            collector_id: user.id,
            type: transaction.type,
            condition: "good", // Default condition
            weight: transaction.weight,
            acquired_date: transaction.created_at,
            source: `Transaction ${transaction.id}`,
            status: "available",
          })
        }
      }

      await fetchInventory()
      alert("Inventory berhasil diperbarui dari transaksi terbaru!")
    } catch (error) {
      console.error("Error updating inventory:", error)
      alert("Gagal memperbarui inventory")
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

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "fair":
        return "bg-yellow-100 text-yellow-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Tersedia</Badge>
      case "sold":
        return <Badge className="bg-blue-100 text-blue-800">Terjual</Badge>
      case "damaged":
        return <Badge variant="destructive">Rusak</Badge>
      case "processing":
        return <Badge variant="secondary">Diproses</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const uniqueTypes = Array.from(new Set(inventory.map((item) => item.type)))
  const uniqueConditions = Array.from(new Set(inventory.map((item) => item.condition)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/collector/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Inventory Kardus</h1>
              <p className="text-green-100">{filteredInventory.length} item ditemukan</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-green-700"
            onClick={updateInventoryFromTransactions}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalWeight}kg</p>
                  <p className="text-xs text-gray-600">Total Berat</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalValue / 1000)}k</p>
                  <p className="text-xs text-gray-600">Est. Nilai</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.uniqueTypes}</p>
                  <p className="text-xs text-gray-600">Jenis Kardus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-bold">{stats.oldestItem ? formatDate(stats.oldestItem) : "N/A"}</p>
                  <p className="text-xs text-gray-600">Item Terl</p>
                  <p className="text-xs text-gray-600">Item Terlama</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={updateInventoryFromTransactions}>
            <Plus className="h-4 w-4 mr-2" />
            Update dari Transaksi
          </Button>
          <Button variant="outline">
            <Truck className="h-4 w-4 mr-2" />
            Jual ke Pabrik
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan jenis, sumber, atau catatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Jenis</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Kondisi</label>
                  <Select value={conditionFilter} onValueChange={setConditionFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kondisi</SelectItem>
                      {uniqueConditions.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {getConditionLabel(condition)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="available">Tersedia</SelectItem>
                      <SelectItem value="sold">Terjual</SelectItem>
                      <SelectItem value="damaged">Rusak</SelectItem>
                      <SelectItem value="processing">Diproses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List */}
        {filteredInventory.length > 0 ? (
          <div className="space-y-4">
            {filteredInventory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{item.type}</h3>
                        <Badge className={getConditionColor(item.condition)}>{getConditionLabel(item.condition)}</Badge>
                        {getStatusBadge(item.status || "available")}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Sumber: {item.source || "Manual Entry"}</p>
                      <p className="text-xs text-gray-500">Diperoleh: {formatDate(item.acquired_date)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>{item.weight}kg</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Est. {formatCurrency(getAveragePrice(item.type, item.condition))}/kg
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(item.weight * getAveragePrice(item.type, item.condition))}
                      </p>
                      <p className="text-xs text-gray-500">Estimasi Nilai</p>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="mb-4 p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">
                        <strong>Catatan:</strong> {item.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Jual
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Inventory Kosong</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || typeFilter !== "all" || conditionFilter !== "all" || statusFilter !== "all"
                  ? "Tidak ada item yang sesuai dengan filter"
                  : "Anda belum memiliki inventory kardus"}
              </p>
              <Button onClick={updateInventoryFromTransactions}>
                <Plus className="h-4 w-4 mr-2" />
                Update dari Transaksi
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation userType="collector" />
    </div>
  )
}
