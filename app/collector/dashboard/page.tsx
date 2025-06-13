"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Package, TrendingUp, MapPin, Bell, Users, DollarSign, Truck, Calendar, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/supabase"
import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription"
import type { Database } from "@/types/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Submission = Database["public"]["Tables"]["cardboard_submissions"]["Row"] & {
  profiles?: Database["public"]["Tables"]["profiles"]["Row"]
  submission_locations?: Database["public"]["Tables"]["submission_locations"]["Row"][]
}
type Transaction = Database["public"]["Tables"]["transactions"]["Row"]
type Notification = Database["public"]["Tables"]["notifications"]["Row"]
type CollectionRoute = Database["public"]["Tables"]["collection_routes"]["Row"]

interface DashboardStats {
  pendingPickups: number
  scheduledPickups: number
  totalWeight: number
  estimatedRevenue: number
  activeCustomers: number
  completedToday: number
}

export default function CollectorDashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [routes, setRoutes] = useState<CollectionRoute[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    pendingPickups: 0,
    scheduledPickups: 0,
    totalWeight: 0,
    estimatedRevenue: 0,
    activeCustomers: 0,
    completedToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Redirect if not authenticated or not a collector
  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push("/auth/login")
      return
    }

    if (!authLoading && profile && profile.user_type !== "collector") {
      router.push("/customer/dashboard")
      return
    }
  }, [user, profile, authLoading, router])

  // Fetch dashboard data
  useEffect(() => {
    if (user && profile?.user_type === "collector") {
      fetchDashboardData()
    }
  }, [user, profile])

  // Subscribe to real-time updates
  useSupabaseSubscription({
    table: "cardboard_submissions",
    onInsert: (payload) => {
      console.log("New submission:", payload)
      fetchSubmissions()
      fetchStats()
    },
    onUpdate: (payload) => {
      console.log("Submission updated:", payload)
      fetchSubmissions()
      fetchStats()
    },
  })

  useSupabaseSubscription({
    table: "notifications",
    filter: { column: "user_id", value: user?.id },
    onInsert: (payload) => {
      console.log("New notification:", payload)
      fetchNotifications()
    },
  })

  const fetchDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
      await Promise.all([fetchSubmissions(), fetchTransactions(), fetchNotifications(), fetchRoutes(), fetchStats()])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("cardboard_submissions")
        .select(`
          *,
          profiles!cardboard_submissions_customer_id_fkey (
            id,
            name,
            phone,
            company_name
          ),
          submission_locations (
            id,
            address,
            latitude,
            longitude,
            pickup_instructions
          )
        `)
        .in("status", ["pending", "scheduled"])
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error("Error fetching submissions:", error)
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
        .limit(10)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
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

  const fetchRoutes = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("collection_routes")
        .select("*")
        .eq("collector_id", user.id)
        .eq("route_date", today)
        .order("created_at", { ascending: false })

      if (error) throw error
      setRoutes(data || [])
    } catch (error) {
      console.error("Error fetching routes:", error)
    }
  }

  const fetchStats = async () => {
    if (!user) return

    try {
      // Get all submissions
      const { data: allSubmissions, error: submissionsError } = await supabase.from("cardboard_submissions").select("*")

      if (submissionsError) throw submissionsError

      // Get today's completed transactions
      const today = new Date().toISOString().split("T")[0]
      const { data: todayTransactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("collector_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`)

      if (transactionsError) throw transactionsError

      // Get unique customers
      const { data: customers, error: customersError } = await supabase
        .from("transactions")
        .select("customer_id")
        .eq("collector_id", user.id)
        .not("customer_id", "is", null)

      if (customersError) throw customersError

      const pendingSubmissions = allSubmissions?.filter((s) => s.status === "pending") || []
      const scheduledSubmissions = allSubmissions?.filter((s) => s.status === "scheduled") || []

      const totalWeight =
        pendingSubmissions.reduce((sum, s) => sum + s.weight, 0) +
        scheduledSubmissions.reduce((sum, s) => sum + s.weight, 0)

      const estimatedRevenue =
        pendingSubmissions.reduce((sum, s) => sum + s.estimated_price, 0) +
        scheduledSubmissions.reduce((sum, s) => sum + s.estimated_price, 0)

      const uniqueCustomers = new Set(customers?.map((c) => c.customer_id) || [])

      setStats({
        pendingPickups: pendingSubmissions.length,
        scheduledPickups: scheduledSubmissions.length,
        totalWeight,
        estimatedRevenue,
        activeCustomers: uniqueCustomers.size,
        completedToday: todayTransactions?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const handleScheduleSubmission = async (submissionId: string) => {
    if (!user) return

    try {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 1) // Schedule for tomorrow

      const { error } = await supabase
        .from("cardboard_submissions")
        .update({
          status: "scheduled",
          scheduled_collector_id: user.id,
          scheduled_pickup_date: scheduledDate.toISOString(),
        })
        .eq("id", submissionId)

      if (error) throw error

      // Refresh submissions
      await fetchSubmissions()
      await fetchStats()

      alert("Pickup berhasil dijadwalkan!")
    } catch (error) {
      console.error("Error scheduling submission:", error)
      alert("Gagal menjadwalkan pickup")
    }
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

  const calculateDistance = (submission: Submission) => {
    // Mock distance calculation - in real app, use geolocation API
    return Math.random() * 5 + 0.5 // Random distance between 0.5-5.5 km
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Terjadwal</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated or not a collector
  if (!user || !profile || profile.user_type !== "collector") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard Pengepul</h1>
            <p className="text-green-100">Selamat datang, {profile.name || "Pengepul"}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-green-700"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
                <Bell className="h-5 w-5" />
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
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800">Notifikasi Terbaru</CardTitle>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingPickups}</p>
                  <p className="text-xs text-gray-600">Pending Pickup</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.scheduledPickups}</p>
                  <p className="text-xs text-gray-600">Terjadwal</p>
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
                  <p className="text-lg font-bold">{formatCurrency(stats.estimatedRevenue / 1000)}k</p>
                  <p className="text-xs text-gray-600">Est. Pendapatan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/collector/map">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
              <MapPin className="h-5 w-5 mb-1" />
              <span className="text-xs">Peta</span>
            </Button>
          </Link>
          <Link href="/collector/route">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
              <Truck className="h-5 w-5 mb-1" />
              <span className="text-xs">Rute</span>
            </Button>
          </Link>
          <Link href="/collector/prices">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs">Harga</span>
            </Button>
          </Link>
        </div>

        {/* Pending Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Pengajuan Terbaru
              <Badge variant="secondary">{stats.pendingPickups} pending</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.filter((s) => s.status === "pending").length > 0 ? (
              <div className="space-y-3">
                {submissions
                  .filter((s) => s.status === "pending")
                  .map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            {submission.profiles?.name || submission.profiles?.company_name || "Pelanggan"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {submission.submission_locations?.[0]?.address || "Alamat tidak tersedia"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {calculateDistance(submission).toFixed(1)}km
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-gray-600">Jenis</p>
                          <p className="font-medium">{submission.type}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Berat</p>
                          <p className="font-medium">{submission.weight}kg</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Est. Harga</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency(submission.estimated_price / 1000)}k
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleScheduleSubmission(submission.id)}>
                          Jadwalkan
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Detail
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Tidak ada pengajuan pending</p>
            )}

            <Link href="/collector/submissions">
              <Button variant="outline" className="w-full mt-4">
                Lihat Semua Pengajuan
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jadwal Hari Ini</CardTitle>
            <CardDescription>Pickup yang sudah dijadwalkan</CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.filter((s) => s.status === "scheduled").length > 0 ? (
              <div className="space-y-3">
                {submissions
                  .filter((s) => s.status === "scheduled")
                  .map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {submission.profiles?.name || submission.profiles?.company_name || "Pelanggan"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {submission.weight}kg - {submission.type}
                        </p>
                        {submission.scheduled_pickup_date && (
                          <p className="text-xs text-gray-500">{formatDate(submission.scheduled_pickup_date)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className="mb-1">Terjadwal</Badge>
                        <p className="text-sm text-gray-600">{calculateDistance(submission).toFixed(1)}km</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Tidak ada pickup hari ini</p>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.activeCustomers}</p>
              <p className="text-sm text-gray-600">Pelanggan Aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.completedToday}</p>
              <p className="text-sm text-gray-600">Selesai Hari Ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">#{transaction.receipt_number || transaction.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                      <p className="text-sm">
                        {transaction.weight}kg - {transaction.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(transaction.total_amount)}</p>
                      <Badge className="mt-1">Selesai</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation userType="collector" />
    </div>
  )
}
