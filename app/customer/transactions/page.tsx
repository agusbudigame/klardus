"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ArrowLeft, Download, Search, Calendar, FileText, FileCheck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { InvoicePreview } from "@/components/invoice-preview"

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  profiles?: {
    name: string
    company_name?: string
    phone?: string
    email?: string
    address?: string
  }
}

export default function CustomerTransactions() {
  const { user } = useAuth()
  const supabase = getSupabaseClient()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalWeight: 0,
    totalAmount: 0,
    avgPricePerKg: 0,
  })
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  // Subscribe to real-time updates
  useSupabaseSubscription(
    "transactions",
    (payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        if (payload.new.customer_id === user?.id) {
          fetchTransactions()
        }
      }
    },
    [user],
  )

  useEffect(() => {
    if (user) {
      fetchTransactions()
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
          profiles!transactions_collector_id_fkey (
            name,
            company_name,
            phone,
            email,
            address
          )
        `,
        )
        .eq("customer_id", user.id)
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
        const avgPricePerKg = totalWeight > 0 ? totalAmount / totalWeight : 0

        setStats({
          totalTransactions: completedTransactions.length,
          totalWeight,
          totalAmount,
          avgPricePerKg,
        })
      } else {
        setStats({
          totalTransactions: 0,
          totalWeight: 0,
          totalAmount: 0,
          avgPricePerKg: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
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
            NOTA PENJUALAN KARDUS BEKAS
=================================================
No. Nota: ${transaction.receipt_number || "-"}
Tanggal: ${formatDate(transaction.created_at)}
-------------------------------------------------
Pelanggan: ${user?.name || ""}
Pengepul: ${transaction.profiles?.name || ""}
-------------------------------------------------
Jenis Kardus: ${transaction.type}
Berat: ${transaction.weight} kg
Harga per kg: ${formatCurrency(transaction.price_per_kg)}
-------------------------------------------------
TOTAL: ${formatCurrency(transaction.total_amount)}
Status: ${transaction.payment_status === "completed" ? "LUNAS" : "BELUM LUNAS"}
=================================================
        Terima kasih atas penjualan Anda!
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
          <Link href="/customer/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Transaksi Saya</h1>
            <p className="text-sm text-gray-600">Riwayat penjualan kardus bekas</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Total Transaksi</div>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Total Berat</div>
              <div className="text-2xl font-bold">{stats.totalWeight.toFixed(1)} kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Total Pendapatan</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Rata-rata Harga</div>
              <div className="text-2xl font-bold">{formatCurrency(stats.avgPricePerKg)}/kg</div>
            </CardContent>
          </Card>
        </div>

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
                          <div className="text-sm text-gray-500">{transaction.receipt_number || "No. Nota: -"}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(transaction.total_amount)}</div>
                          <div className="text-sm text-gray-500">{transaction.weight} kg</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(transaction.created_at)}</span>
                        </div>
                        <div>{getStatusBadge(transaction.payment_status)}</div>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 bg-gray-50 p-2 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                        onClick={() => showInvoice(transaction)}
                      >
                        <FileCheck className="h-4 w-4 mr-1" />
                        Invoice
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                        onClick={() => downloadReceipt(transaction)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Nota
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Belum Ada Transaksi</h3>
              <p className="text-gray-500 mt-1">Transaksi penjualan kardus bekas Anda akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold">Detail Transaksi</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">No. Nota</span>
                <span className="font-medium">{selectedTransaction.receipt_number || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tanggal</span>
                <span className="font-medium">{formatDate(selectedTransaction.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pengepul</span>
                <span className="font-medium">{selectedTransaction.profiles?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jenis Kardus</span>
                <span className="font-medium">{selectedTransaction.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Berat</span>
                <span className="font-medium">{selectedTransaction.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Harga per kg</span>
                <span className="font-medium">{formatCurrency(selectedTransaction.price_per_kg)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-green-600">{formatCurrency(selectedTransaction.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span>{getStatusBadge(selectedTransaction.payment_status)}</span>
              </div>
              {selectedTransaction.notes && (
                <div>
                  <span className="text-gray-500 block mb-1">Catatan</span>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-between">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Tutup
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false)
                    setShowInvoiceModal(true)
                  }}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Invoice
                </Button>
                <Button onClick={() => downloadReceipt(selectedTransaction)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Nota
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedTransaction && (
        <InvoicePreview
          transaction={selectedTransaction}
          customerName={user?.name || ""}
          collectorName={selectedTransaction.profiles?.name || "Pengepul"}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      <BottomNavigation userType="customer" />
    </div>
  )
}
