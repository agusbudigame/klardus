# 📦 Kardus Bekas App

Aplikasi Progressive Web App (PWA) untuk manajemen bisnis pengepul kardus bekas.

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

## 📋 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Konfigurasi Supabase](#-konfigurasi-supabase)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Struktur Proyek](#-struktur-proyek)
- [Fitur Utama](#-fitur-utama)
- [Troubleshooting](#-troubleshooting)
- [Kontribusi](#-kontribusi)

## 🌟 Gambaran Umum

Kardus Bekas App adalah aplikasi PWA yang membantu pengepul kardus bekas dan pelanggannya dalam melakukan transaksi jual beli kardus bekas secara efisien. Aplikasi ini menyelesaikan berbagai masalah dalam bisnis pengepulan kardus bekas seperti:

- Efisiensi rute pengambilan kardus
- Manajemen transaksi jual beli
- Pembaruan harga real-time
- Tracking inventori
- Analisis data penjualan dan pembelian

## 🔧 Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

- [Node.js](https://nodejs.org/) (versi 18.x atau lebih baru)
- [npm](https://www.npmjs.com/) (biasanya terinstal bersama Node.js)
- [Git](https://git-scm.com/)
- IDE pilihan Anda (disarankan: [Visual Studio Code](https://code.visualstudio.com/))
- Akun [Supabase](https://supabase.com/) (untuk database)

## 📥 Instalasi

### 1. Clone Repository

\`\`\`bash
git clone https://github.com/yourusername/kardus-bekas-app.git
cd kardus-bekas-app
\`\`\`

### 2. Instal Dependencies

\`\`\`bash
npm install
\`\`\`

## ⚙️ Konfigurasi Supabase

### 1. Buat Project Supabase

1. Buka [Supabase Dashboard](https://app.supabase.com/)
2. Klik "New Project" dan ikuti petunjuk untuk membuat project baru
3. Catat URL dan anon key project Anda

### 2. Setup Database

1. Buka SQL Editor di dashboard Supabase
2. Jalankan script SQL berikut secara berurutan:

\`\`\`bash
# Jalankan script setup database
npm run setup:db
\`\`\`

Atau jalankan script SQL secara manual dari folder `scripts/` dalam urutan berikut:
- `01-schema-setup.sql`
- `02-rls-policies.sql`
- `03-sample-data.sql`
- `04-triggers-functions.sql`
- ...dan seterusnya sampai `19-enhance-invoice-support.sql`

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root proyek:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

## 🚀 Menjalankan Aplikasi

### Development Mode

\`\`\`bash
npm run dev
\`\`\`

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

### Production Build

\`\`\`bash
npm run build
npm start
\`\`\`

### PWA Setup

Untuk mengaktifkan fitur PWA secara lokal:

\`\`\`bash
# Jalankan setup PWA
node scripts/node-setup.js
\`\`\`

## 📁 Struktur Proyek

\`\`\`
kardus-bekas-app/
├── app/                    # Next.js App Router
│   ├── auth/               # Halaman autentikasi
│   ├── collector/          # Halaman untuk pengepul
│   ├── customer/           # Halaman untuk pelanggan
│   ├── layout.tsx          # Layout utama
│   └── page.tsx            # Landing page
├── components/             # Komponen React
│   ├── ui/                 # Komponen UI dasar
│   └── ...                 # Komponen lainnya
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── public/                 # Asset statis
├── scripts/                # Script SQL dan setup
├── styles/                 # CSS global
└── types/                  # TypeScript type definitions
\`\`\`

## 🎯 Fitur Utama

### Untuk Pelanggan:
- 👀 Melihat harga kardus bekas terkini
- 📱 Menerima notifikasi perubahan harga
- 📊 Melihat statistik penjualan
- 📝 Mengajukan penjualan kardus bekas
- 🧾 Melihat dan mengunduh invoice transaksi

### Untuk Pengepul:
- 💰 Mengupdate harga kardus bekas
- 🔔 Mengirim notifikasi ke pelanggan
- 🗺️ Melihat sebaran lokasi kardus bekas pada peta
- 📋 Mengelola daftar pengajuan kardus bekas
- 🚚 Mengoptimasi rute pengambilan
- 📊 Melihat laporan pembelian dan inventori

## ❓ Troubleshooting

### Error Koneksi Supabase

Jika mengalami masalah koneksi ke Supabase:

1. Periksa file `.env.local` dan pastikan URL dan key sudah benar
2. Buka halaman `/setup` di aplikasi untuk menguji koneksi
3. Periksa log di konsol browser untuk error spesifik

### Error Foreign Key Constraint

Jika muncul error "violates foreign key constraint":

\`\`\`bash
# Jalankan script perbaikan
node scripts/17-fix-foreign-key-error.sql
\`\`\`

### Error "window is not defined"

Jika mengalami error ini saat menjalankan script:

\`\`\`bash
# Gunakan script node-setup.js sebagai gantinya
node scripts/node-setup.js
\`\`\`

## 👥 Kontribusi

Kontribusi selalu diterima! Jika Anda ingin berkontribusi:

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit perubahan Anda (`git commit -m 'Add some amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

---

Dibuat dengan ❤️ untuk membantu pengepul kardus bekas
