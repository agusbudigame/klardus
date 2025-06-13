"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ArrowLeft, Search, MapPin, Phone, Calendar, Package } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/supabase"
import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription"
import type { Database } from "@/types/supabase"
import Link from "next/link"

type Submission = Database["public"]["Tables"]["cardboard_submissions"]["Row"] & {
  profiles?: Database["public"]["Tables"]["profiles"]["Row"]
  submission_locations?: Database["public"]["Tables"]["submission_locations"]["Row"][]
}

export default function CollectorSubmissions() {
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    fetchSubmissions()
  }, [])

  // Subscribe to real-time updates
  useSupabaseSubscription({
    table: "cardboard_submissions",
    onInsert: () => fetchSubmissions(),
    onUpdate: () => fetchSubmissions(),
  })

  // Filter submissions when filters change
  useEffect(() => {
    let filtered = submissions

    if (searchTerm) {
      filtered = filtered.filter(
        (submission) =>
          submission.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.submission_locations?.[0]?.address?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((submission) => submission.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((submission) => submission.type === typeFilter)
    }

    setFilteredSubmissions(filtered)
  }, [submissions, searchTerm, statusFilter, typeFilter])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("cardboard_submissions")
        .select(`
          *,
          profiles!cardboard_submissions_customer_id_fkey (
            id,
            name,
            phone,
            company_name,
            email
          ),
          submission_locations (
            id,
            address,
            latitude,
            longitude,
            pickup_instructions
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
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

      await fetchSubmissions()
      alert("Pickup berhasil dijadwalkan!")
    } catch (error) {
      console.error("Error scheduling submission:", error)
      alert("Gagal menjadwalkan pickup")
    }
  }

  const handleCompleteSubmission = async (submissionId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("cardboard_submissions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", submissionId)

      if (error) throw error

      await fetchSubmissions()
      alert("Pickup berhasil diselesaikan!")
    } catch (error) {
      console.error("Error completing submission:", error)
      alert("Gagal menyelesaikan pickup")
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

  const uniqueTypes = Array.from(new Set(submissions.map((s) => s.type)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat pengajuan...</p>
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
            <h1 className="text-xl font-bold text-gray-900">Semua Pengajuan</h1>
            <p className="text-sm text-gray-600">{filteredSubmissions.length} pengajuan ditemukan</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan nama, perusahaan, atau alamat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="scheduled">Terjadwal</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Jenis Kardus</label>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        {filteredSubmissions.length > 0 ? (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {submission.profiles?.name || submission.profiles?.company_name || "Pelanggan"}
                        </h3>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {submission.submission_locations?.[0]?.address || "Alamat tidak tersedia"}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(submission.created_at)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>{submission.type}</strong> - {getConditionLabel(submission.condition)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          <strong>{submission.weight}kg</strong>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(submission.estimated_price)}</p>
                        <p className="text-xs text-gray-500">estimasi</p>
                      </div>
                    </div>
                  </div>

                  {submission.notes && (
                    <div className="mb-4 p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">
                        <strong>Catatan:</strong> {submission.notes}
                      </p>
                    </div>
                  )}

                  {submission.scheduled_pickup_date && (
                    <div className="mb-4 p-2 bg-blue-50 rounded">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-blue-700">
                          <strong>Dijadwalkan:</strong> {formatDate(submission.scheduled_pickup_date)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {submission.status === "pending" && (
                      <Button size="sm" className="flex-1" onClick={() => handleScheduleSubmission(submission.id)}>
                        Jadwalkan Pickup
                      </Button>
                    )}

                    {submission.status === "scheduled" && (
                      <Button size="sm" className="flex-1" onClick={() => handleCompleteSubmission(submission.id)}>
                        Selesaikan Pickup
                      </Button>
                    )}

                    {submission.profiles?.phone && (
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="h-4 w-4 mr-1" />
                        Hubungi
                      </Button>
                    )}

                    <Button size="sm" variant="outline" className="flex-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      Lokasi
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Pengajuan</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Tidak ada pengajuan yang sesuai dengan filter"
                  : "Belum ada pengajuan kardus masuk"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation userType="collector" />
    </div>
  )
}
