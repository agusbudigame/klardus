"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Package, TrendingUp, Clock, DollarSign, Plus, Bell, Download, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"

type CardboardPrice = Database["public"]["Tables"]["cardboard_prices"]["Row"]
type Transaction = Database["public"]["Tables"]["transactions"]["Row"]
type Submission = Database["public"]["Tables"]["cardboard_submissions"]["Row"]
type Notification = Database["public"]["Tables"]["notifications"]["Row"]

interface DashboardStats {
  totalSales: number
  totalWeight: number
  totalEarnings: number
  pendingPickups: number
}

export default function CustomerDashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [prices, setPrices] = useState<CardboardPrice[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalWeight: 0,
    totalEarnings: 0,
    pendingPickups: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Redirect if not authenticated or not a customer
  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push("/auth/login")
      return
    }

    if (!authLoading && profile && profile.user_type !== "customer") {
      router.push("/collector/dashboard")
      return
    }
  }, [user, profile, authLoading, router])

  // Fetch dashboard data
  useEffect(() => {
    if (user && profile?.user_type === "customer") {
      fetchDashboardData()
    }
  }, [user, profile])

  const fetchDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
      await Promise.all([fetchPrices(), fetchTransactions(), fetchSubmissions(), fetchNotifications()])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from("cardboard_prices")
        .select("*")
        .eq("is_active", true)
        .order("type", { ascending: true })
        .order("condition", { ascending: false })

      if (error) throw error
      setPrices(data || [])
    } catch (error) {
      console.error("Error fetching prices:", error)
    }
  }

  const fetchTransactions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }

  const fetchSubmissions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("cardboard_submissions")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSubmissions(data || [])

      // Calculate stats from submissions and transactions
      calculateStats(data || [], transactions)
    } catch (error) {
      console.error("Error fetching submissions:", error)
    }
  }

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const calculateStats = (submissionsData: Submission[], transactionsData: Transaction[]) => {
    const completedSubmissions = submissionsData.filter((s) => s.status === "completed")
    const pendingSubmissions = submissionsData.filter((s) => s.status === "pending" || s.status === "scheduled")

    const totalWeight = completedSubmissions.reduce((sum, s) => sum + s.weight, 0)
    const totalEarnings = transactionsData.reduce((sum, t) => sum + t.total_amount, 0)

    setStats({
      totalSales: completedSubmissions.length,
      totalWeight,
      totalEarnings,
      pendingPickups: pendingSubmissions.length,
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

      if (error) throw error

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Terjadwal</Badge>
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated or not a customer
  if (!user || !profile || profile.user_type !== "customer") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Selamat datang, {profile.name || "Pelanggan"}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className={refreshing ? "animate-spin" : ""}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Notifications */}
        {notifications.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">Notifikasi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start justify-between p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-600">{notification.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(notification.created_at)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalSales}</p>
                  <p className="text-xs text-gray-600">Total Penjualan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
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
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalEarnings)}</p>
                  <p className="text-xs text-gray-600">Total Pendapatan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingPickups}</p>
                  <p className="text-xs text-gray-600">Menunggu Pickup</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/customer/sell">
                <Button className="w-full h-12 flex flex-col items-center justify-center">
                  <Plus className="h-5 w-5 mb-1" />
                  <span className="text-xs">Jual Kardus</span>
                </Button>
              </Link>
              <Link href="/customer/prices">
                <Button variant="outline" className="w-full h-12 flex flex-col items-center justify-center">
                  <TrendingUp className="h-5 w-5 mb-1" />
                  <span className="text-xs">Lihat Harga</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Current Prices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Harga Terkini</CardTitle>
            <CardDescription>
              Update terakhir: {prices.length > 0 ? formatDate(prices[0].updated_at) : "Belum ada data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prices.length > 0 ? (
              <div className="space-y-3">
                {prices.slice(0, 6).map((price) => (
                  <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{price.type}</p>
                      <p className="text-sm text-gray-600">Kondisi: {getConditionLabel(price.condition)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(price.price_per_kg)}</p>
                      <p className="text-xs text-gray-600">per kg</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada data harga tersedia</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">#{transaction.receipt_number || transaction.id.slice(0, 8)}</p>
                        {getStatusBadge(transaction.payment_status || "completed")}
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                      <p className="text-sm">
                        {transaction.weight}kg - {transaction.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(transaction.total_amount)}</p>
                      {transaction.payment_status === "completed" && (
                        <Button variant="ghost" size="sm" className="mt-1">
                          <Download className="h-3 w-3 mr-1" />
                          <span className="text-xs">Nota</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada transaksi</p>
            )}
            <Link href="/customer/transactions">
              <Button variant="outline" className="w-full mt-4">
                Lihat Semua Transaksi
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pengajuan Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.slice(0, 3).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{submission.type}</p>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(submission.created_at)}</p>
                      <p className="text-sm">
                        {submission.weight}kg - {getConditionLabel(submission.condition)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(submission.estimated_price)}</p>
                      <p className="text-xs text-gray-600">estimasi</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation userType="customer" />
    </div>
  )
}
