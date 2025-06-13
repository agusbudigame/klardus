"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Printer, X } from "lucide-react"
import { generateInvoicePDF } from "@/lib/pdf-generator"
import type { Database } from "@/types/supabase"
import { format } from "date-fns"
import { id } from "date-fns/locale"

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  profiles?: {
    name?: string
    company_name?: string
    phone?: string
    email?: string
    address?: string
  }
}

interface InvoicePreviewProps {
  transaction: Transaction
  customerName: string
  collectorName: string
  onClose: () => void
}

export function InvoicePreview({ transaction, customerName, collectorName, onClose }: InvoicePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined)
  const invoiceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load logo (placeholder for now)
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 100
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#4CAF50"
      ctx.font = "bold 20px Arial"
      ctx.fillText("KARDUS BEKAS", 10, 50)
      setLogoDataUrl(canvas.toDataURL())
    }
  }, [])

  const downloadPDF = () => {
    setIsGenerating(true)
    try {
      const doc = generateInvoicePDF(transaction, customerName, collectorName, logoDataUrl)
      doc.save(`Invoice-${transaction.receipt_number || transaction.id}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Gagal membuat PDF. Silakan coba lagi.")
    } finally {
      setIsGenerating(false)
    }
  }

  const printPDF = () => {
    setIsGenerating(true)
    try {
      const doc = generateInvoicePDF(transaction, customerName, collectorName, logoDataUrl)
      const blob = doc.output("blob")
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url)

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
          URL.revokeObjectURL(url)
        }
      } else {
        URL.revokeObjectURL(url)
        alert("Popup diblokir. Mohon izinkan popup untuk mencetak invoice.")
      }
    } catch (error) {
      console.error("Error printing PDF:", error)
      alert("Gagal mencetak PDF. Silakan coba lagi.")
    } finally {
      setIsGenerating(false)
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
    return format(new Date(dateString), "dd MMMM yyyy", { locale: id })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="sticky top-0 bg-white z-10 p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Invoice</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6" ref={invoiceRef}>
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center">
              {logoDataUrl && <img src={logoDataUrl || "/placeholder.svg"} alt="Logo" className="h-12 mr-3" />}
              <div>
                <h1 className="text-2xl font-bold text-green-600">KARDUS BEKAS</h1>
                <p className="text-gray-500 text-sm">Aplikasi Jual Beli Kardus Bekas</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-green-600">INVOICE</h2>
              <p className="text-gray-600">{transaction.receipt_number || transaction.id}</p>
              <p className="text-gray-600">{formatDate(transaction.created_at)}</p>
              {transaction.payment_status === "completed" ? (
                <Badge className="mt-2 bg-green-500">LUNAS</Badge>
              ) : (
                <Badge className="mt-2 bg-yellow-500">BELUM LUNAS</Badge>
              )}
            </div>
          </div>

          {/* Customer & Collector Info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-bold text-gray-700 mb-1">Dari:</h3>
              <p>{collectorName}</p>
              <p className="text-gray-600 text-sm">Pengepul Kardus Bekas</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-1">Kepada:</h3>
              <p>{transaction.profiles?.company_name || customerName}</p>
              {transaction.profiles?.address && <p className="text-gray-600 text-sm">{transaction.profiles.address}</p>}
              {transaction.profiles?.phone && (
                <p className="text-gray-600 text-sm">Telp: {transaction.profiles.phone}</p>
              )}
              {transaction.profiles?.email && <p className="text-gray-600 text-sm">{transaction.profiles.email}</p>}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Deskripsi</th>
                  <th className="border p-2 text-right">Berat (kg)</th>
                  <th className="border p-2 text-right">Harga per kg</th>
                  <th className="border p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">{transaction.type}</td>
                  <td className="border p-2 text-right">{transaction.weight}</td>
                  <td className="border p-2 text-right">{formatCurrency(transaction.price_per_kg)}</td>
                  <td className="border p-2 text-right">{formatCurrency(transaction.total_amount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={3} className="border p-2 text-right">
                    Total
                  </td>
                  <td className="border p-2 text-right">{formatCurrency(transaction.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="mb-8">
              <h3 className="font-bold text-gray-700 mb-1">Catatan:</h3>
              <p className="text-gray-600 bg-gray-50 p-3 rounded">{transaction.notes}</p>
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="text-xs text-gray-500 mb-4">
            <h4 className="font-bold mb-1">Syarat & Ketentuan:</h4>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Invoice ini adalah bukti resmi transaksi jual beli kardus bekas.</li>
              <li>Pembayaran dianggap lunas setelah status berubah menjadi LUNAS.</li>
              <li>Keluhan dapat disampaikan maksimal 1x24 jam setelah transaksi.</li>
            </ol>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">
            <p>Invoice ini dibuat secara otomatis oleh Aplikasi Kardus Bekas</p>
            <p>Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white z-10 p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button variant="outline" onClick={printPDF} disabled={isGenerating}>
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
          <Button onClick={downloadPDF} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </Card>
    </div>
  )
}
