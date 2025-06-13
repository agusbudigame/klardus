import { jsPDF } from "jspdf"
import "jspdf-autotable"
import type { Database } from "@/types/supabase"

// Extend jsPDF with autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  profiles?: {
    name?: string
    company_name?: string
    phone?: string
    email?: string
    address?: string
  }
}

export const generateInvoicePDF = (
  transaction: Transaction,
  customerName: string,
  collectorName: string,
  logoDataUrl?: string,
) => {
  // Create a new PDF document
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  const contentWidth = pageWidth - 2 * margin

  // Set font
  doc.setFont("helvetica")

  // Add logo if available
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", margin, margin, 40, 20)
  }

  // Add title
  doc.setFontSize(22)
  doc.setTextColor(0, 128, 0) // Green color
  doc.text("INVOICE", pageWidth - margin - 50, margin + 10)

  // Add invoice details
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100) // Gray color
  doc.text(`No. Invoice: ${transaction.receipt_number || transaction.id}`, pageWidth - margin - 50, margin + 20)
  doc.text(
    `Tanggal: ${new Date(transaction.created_at).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    pageWidth - margin - 50,
    margin + 25,
  )

  // Add company info
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0) // Black color
  doc.setFont("helvetica", "bold")
  doc.text("Kardus Bekas App", margin, margin + 30)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Aplikasi Jual Beli Kardus Bekas", margin, margin + 35)
  doc.text("Indonesia", margin, margin + 40)
  doc.text("Email: info@kardusbekas.app", margin, margin + 45)

  // Add customer and collector info
  const yPos = margin + 60
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Dari:", margin, yPos)
  doc.text("Kepada:", pageWidth / 2, yPos)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(collectorName, margin, yPos + 5)
  doc.text(transaction.profiles?.company_name || customerName, pageWidth / 2, yPos + 5)

  if (transaction.profiles?.address) {
    doc.text(transaction.profiles.address, pageWidth / 2, yPos + 10)
  }

  if (transaction.profiles?.phone) {
    doc.text(`Telp: ${transaction.profiles.phone}`, pageWidth / 2, yPos + 15)
  }

  if (transaction.profiles?.email) {
    doc.text(`Email: ${transaction.profiles.email}`, pageWidth / 2, yPos + 20)
  }

  // Add transaction details table
  const tableStartY = yPos + 30
  doc.autoTable({
    startY: tableStartY,
    head: [["Deskripsi", "Berat (kg)", "Harga per kg", "Total"]],
    body: [
      [
        transaction.type,
        transaction.weight.toString(),
        formatCurrency(transaction.price_per_kg),
        formatCurrency(transaction.total_amount),
      ],
    ],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [0, 128, 0] },
  })

  // Get the last position of the table
  const finalY = (doc as any).lastAutoTable.finalY

  // Add total
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Total:", pageWidth - margin - 40, finalY + 10)
  doc.text(formatCurrency(transaction.total_amount), pageWidth - margin, finalY + 10, { align: "right" })

  // Add payment status
  doc.setFontSize(12)
  if (transaction.payment_status === "completed") {
    doc.setTextColor(0, 128, 0) // Green for completed
    doc.text("LUNAS", pageWidth - margin, finalY + 20, { align: "right" })
  } else {
    doc.setTextColor(255, 0, 0) // Red for pending
    doc.text("BELUM LUNAS", pageWidth - margin, finalY + 20, { align: "right" })
  }

  // Add notes if available
  if (transaction.notes) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100) // Gray color
    doc.setFont("helvetica", "italic")
    doc.text("Catatan:", margin, finalY + 30)
    doc.text(transaction.notes, margin, finalY + 35)
  }

  // Add footer
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150) // Light gray
  doc.setFont("helvetica", "normal")
  doc.text("Invoice ini dibuat secara otomatis oleh Aplikasi Kardus Bekas", pageWidth / 2, pageHeight - margin, {
    align: "center",
  })
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, pageWidth / 2, pageHeight - margin + 5, {
    align: "center",
  })

  // Add QR code placeholder (in a real app, you'd generate an actual QR code)
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(margin, finalY + 40, 40, 40, 3, 3, "FD")
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text("QR Code", margin + 20, finalY + 60, { align: "center" })
  doc.text("Verifikasi", margin + 20, finalY + 65, { align: "center" })

  // Add terms and conditions
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text("Syarat & Ketentuan:", margin, finalY + 40)
  doc.text("1. Invoice ini adalah bukti resmi transaksi jual beli kardus bekas.", margin, finalY + 45)
  doc.text("2. Pembayaran dianggap lunas setelah status berubah menjadi LUNAS.", margin, finalY + 50)
  doc.text("3. Keluhan dapat disampaikan maksimal 1x24 jam setelah transaksi.", margin, finalY + 55)

  // Return the PDF document
  return doc
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, "")
}
