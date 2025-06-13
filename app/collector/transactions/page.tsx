"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Calendar, Plus, Users, DollarSign, BarChart3, ShoppingBag } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription"
import { format } from "date-fns"
import { id } from "date-fns/locale"

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  profiles?: {
    name: string
    company_name?: string
    phone?: string
    email?: string
    address?: string
  }
  cardboard_submissions?: {
    id: string
    status: string
  }
}

type Submission = Database["public"]["Tables"]["cardboard_submissions"]["Row"] & {
  profiles?: {
    name: string
    company_name?: string
    phone?: string
    email?: string
    address?: string
  }
  submission_locations?: {
    address: string
    latitude: number
    longitude: number
  }[]
}

export default function CollectorTransactions() {
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [completedSubmissions, setCompletedSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalWeight: 0,
    totalAmount: 0,
    uniqueCustomers: 0,
  })
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [newTransaction, setNewTransaction] = useState({
    weight: 0,
    pricePerKg: 0,
    totalAmount: 0,
    notes: "",
  })

  // Subscribe to real-time updates
  useSupabaseSubscription(
    "transactions",
    (payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payload.new.collector_id === user?.id) {
          fetchTransactions()
        }
      }
    },
    [user],
  )

  useEffect(() => {
    if (user) {
      fetchTransactions()
      fetchCompletedSubmissions()
    }
  }, [user, statusFilter, dateFilter])

  const fetchTransactions = async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase
        .from("transactions")
        .select(
          `
          *,
          profiles!transactions_customer_id_fkey (
            name,
            company_name,
            phone,
            email,
            address
          ),
          cardboard_submissions (
            id,
            status
          )
        `,
        )
        .eq("collector_id", user.id)
        .order("created_at", { ascending: false })

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter)
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const today = new Date()
        let startDate = new Date()

        switch (dateFilter) {
          case "today":
            startDate = new Date(today.setHours(0, 0, 0, 0))
            break
          case "week":
            startDate = new Date(today.setDate(today.getDate() - 7))
            break
          case "month":
            startDate = new Date(today.setMonth(today.getMonth() - 1))
            break
          case "year":
            startDate = new Date(today.setFullYear(today.getFullYear() - 1))
            break
        }

        query = query.gte("created_at", startDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      setTransactions(data || [])

      // Calculate stats
      if (data && data.length > 0) {
        const completedTransactions = data.filter((t) => t.payment_status === "completed")
        const totalWeight = completedTransactions.reduce((sum, t) => sum + (t.weight || 0), 0)
        const totalAmount = completedTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
        const uniqueCustomers = new Set(completedTransactions.map((t) => t.customer_id)).size

        setStats({
          totalTransactions: completedTransactions.length,
          totalWeight,
          totalAmount,
          uniqueCustomers,
        })
      } else {
        setStats({
          totalTransactions: 0,
          totalWeight: 0,
          totalAmount: 0,
          uniqueCustomers: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedSubmissions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("cardboard_submissions")
        .select(
          `
          *,
          profiles!cardboard_submissions_customer_id_fkey (
            name,
            company_name,
            phone,
            email,
            address
          ),
          submission_locations (
            address,
            latitude,
            longitude
          )
        `,
        )
        .eq("scheduled_collector_id", user.id)
        .eq("status", "completed")
        .not(
          "id",
          "in",
          `(${transactions
            .map((t) => t.submission_id)
            .filter(Boolean)
            .join(",") || "''"})`
        )
        .order("completed_at", { ascending: false })

      if (error) throw error

      setCompletedSubmissions(data || [])
    } catch (error) {
      console.error("Error fetching completed submissions:", error)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      transaction.receipt_number?.toLowerCase().includes(searchLower) ||
      transaction.type?.toLowerCase().includes(searchLower) ||
      transaction.profiles?.name?.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Selesai</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Menunggu</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Dibatalkan</Badge>
      default:
        return <Badge className="bg-gray-500">{status}</Badge>
    }
  }

  const downloadReceipt = (transaction: Transaction) => {
    // Create receipt content
    const receiptContent = `
=================================================
            NOTA PEMBELIAN KARDUS BEKAS
=================================================
No. Nota: ${transaction.receipt_number || "-"}
Tanggal: ${formatDate(transaction.created_at)}
-------------------------------------------------
Pelanggan: ${transaction.profiles?.name || ""}
Pengepul: ${user?.name || ""}
-------------------------------------------------
Jenis Kardus: ${transaction.type}
Berat: ${transaction.weight} kg
Harga per kg: ${formatCurrency(transaction.price_per_kg)}
-------------------------------------------------
TOTAL: ${formatCurrency(transaction.total_amount)}
Status: ${transaction.payment_status === "completed" ? "LUNAS" : "BELUM LUNAS"}
=================================================
        Terima kasih atas kerjasamanya!
    Aplikasi Kardus Bekas - Daur Ulang Bersama
=================================================
    `

    // Create blob and download
    const blob = new Blob([receiptContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Nota-${transaction.receipt_number || "kardus"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const showTransactionDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowDetailModal(true)
  }

  const showInvoice = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowInvoiceModal(true)
  }

  const openNewTransactionModal = (submission?: Submission) => {
    if (submission) {
      setSelectedSubmission(submission)
      setNewTransaction({
        weight: submission.weight,
        pricePerKg: submission.estimated_price / submission.weight,
        totalAmount: submission.estimated_price,
        notes: `Dari pengajuan ${submission.id}`,
      })
    } else {
      setSelectedSubmission(null)
      setNewTransaction({
        weight: 0,
        pricePerKg: 0,
        totalAmount: 0,
        notes: "",
      })
    }
    setShowNewTransactionModal(true)
  }

  const handleNewTransactionChange = (field: string, value: string | number) => {
    const updatedTransaction = { ...newTransaction }

    if (field === "weight" || field === "pricePerKg") {
      const numValue = typeof value === "string" ? Number.parseFloat(value) : value
      updatedTransaction[field as keyof typeof updatedTransaction] = numValue

      // Update total amount
      const weight = field === "weight" ? numValue : updatedTransaction.weight
      const pricePerKg = field === "pricePerKg" ? numValue : updatedTransaction.pricePerKg
      updatedTransaction.totalAmount = weight * pricePerKg
    } else {
      updatedTransaction[field as keyof typeof updatedTransaction] = value
    }

    setNewTransaction(updatedTransaction)
  }

  const createTransaction = async () => {
    if (!user) return

    try {
      const transactionData: any = {
        collector_id: user.id,
        customer_id: selectedSubmission?.customer_id,
        type: selectedSubmission?.type || "Kardus Campuran",
        weight: newTransaction.weight,
        price_per_kg: newTransaction.pricePerKg,
        total_amount: newTransaction.totalAmount,
        payment_status: "completed",
        notes: newTransaction.notes,
        transaction_date: new Date().toISOString(),
      }

      if (selectedSubmission) {
        transactionData.submission_id = selectedSubmission.id
      }

      const { data, error } = await supabase.from("transactions").insert(transactionData).select()

      if (error) throw error

      // If from submission, update submission status
      if (selectedSubmission) {
        const { error: updateError } = await supabase
          .from("cardboard_submissions")
          .update({ status: "completed" })
          .eq("id", selectedSubmission.id)

        if (updateError) throw updateError
      }

      // Create notification for customer
      if (selectedSubmission?.customer_id) {
        await supabase.from("notifications").insert({
          user_id: selectedSubmission.customer_id,
          title: "Transaksi Berhasil",
          message: `Transaksi pembelian kardus ${
            selectedSubmission.type
          } seberat ${newTransaction.weight} kg senilai ${formatCurrency(newTransaction.totalAmount)} telah selesai.`,
          type: "transaction",
          related_id: data?.[0]?.id,
          action_url: "/customer/transactions",
        })
      }

      setShowNewTransactionModal(false)
      fetchTransactions()
      fetchCompletedSubmissions()
    } catch (error) {
      console.error("Error creating transaction:", error)
      alert("Gagal membuat transaksi")
    }
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat transaksi...</p>
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
            <h1 className="text-xl font-bold text-gray-900">Transaksi</h1>
            <p className="text-sm text-gray-600">Kelola transaksi pembelian kardus</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Transaksi</div>
                  <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                </div>
                <ShoppingBag className="h-8 w-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Berat</div>
                  <div className="text-2xl font-bold">{stats.totalWeight.toFixed(1)} kg</div>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Pengeluaran</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalAmount)}</div>
                </div>
                <DollarSign className="h-8 w-8 text-red-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Pelanggan</div>
                  <div className="text-2xl font-bold">{stats.uniqueCustomers}</div>
                </div>
                <Users className="h-8 w-8 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Transaction Button */}
        <Button className="w-full" onClick={() => openNewTransactionModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Transaksi Baru
        </Button>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari transaksi..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="status-filter" className="text-xs">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="date-filter" className="text-xs">
                Periode
              </Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date-filter" className="w-full">
                  <SelectValue placeholder="Semua Waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Waktu</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">7 Hari Terakhir</SelectItem>
                  <SelectItem value="month">30 Hari Terakhir</SelectItem>
                  <SelectItem value="year">1 Tahun Terakhir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Completed Submissions */}
        {completedSubmissions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pengajuan Selesai</h2>
            <div className="space-y-3">
              {completedSubmissions.map((submission) => (
                <Card key={submission.id} className="overflow-hidden border-l-4 border-l-yellow-500">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{submission.type}</div>
                          <div className="text-sm text-gray-500">{submission.profiles?.name || "Pelanggan"}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(submission.estimated_price)}</div>
                          <div className="text-sm text-gray-500">{submission.weight} kg</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(submission.completed_at || submission.created_at)}</span>
                        </div>
                        <Badge className="bg-yellow-500">Belum Diproses</Badge>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 bg-gray-50 p-2 flex justify-end">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openNewTransactionModal(submission)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Buat Transaksi
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Riwayat Transaksi</h2>

          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 cursor-pointer" onClick={() => showTransactionDetail(transaction)}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{transaction.type}</div>
                          <div className="text-sm text-gray-500">{transaction.profiles?.name || "Pelanggan"}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">{formatCurrency(transaction.total_amount)}</div>
                          <div className="text-sm text-gray-500">{transaction.weight} kg</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(transaction.created_at)}</span>
                        </div>
                        <div>{getStatusBadge
