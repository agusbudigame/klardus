-- Email templates untuk reset password
-- Jalankan di Supabase Dashboard > Authentication > Email Templates

-- Template untuk Reset Password
-- Subject: Reset Password - Kardus Collector App
-- Body:
/*
<h2>Reset Password Anda</h2>
<p>Halo,</p>
<p>Anda telah meminta untuk mereset password akun Kardus Collector App Anda.</p>
<p>Klik tombol di bawah ini untuk membuat password baru:</p>
<p><a href="{{ .SiteURL }}/auth/reset-password?access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&type=recovery" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
<p>Atau salin dan tempel link berikut di browser Anda:</p>
<p>{{ .SiteURL }}/auth/reset-password?access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&type=recovery</p>
<p>Link ini akan kedaluwarsa dalam 1 jam.</p>
<p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
<br>
<p>Salam,<br>Tim Kardus Collector App</p>
*/

-- Template untuk Konfirmasi Email (Sign Up)
-- Subject: Konfirmasi Email - Kardus Collector App
-- Body:
/*
<h2>Selamat Datang di Kardus Collector App!</h2>
<p>Halo {{ .Name }},</p>
<p>Terima kasih telah mendaftar di Kardus Collector App. Untuk mengaktifkan akun Anda, silakan konfirmasi email dengan mengklik tombol di bawah ini:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Konfirmasi Email</a></p>
<p>Atau salin dan tempel link berikut di browser Anda:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Link ini akan kedaluwarsa dalam 24 jam.</p>
<br>
<p>Salam,<br>Tim Kardus Collector App</p>
*/

-- Konfigurasi Site URL
-- Pastikan Site URL di Supabase Dashboard > Settings > General sudah diset ke:
-- Development: http://localhost:3000
-- Production: https://your-domain.com

-- Konfigurasi Redirect URLs
-- Tambahkan URL berikut di Supabase Dashboard > Authentication > URL Configuration:
-- http://localhost:3000/auth/reset-password
-- https://your-domain.com/auth/reset-password
