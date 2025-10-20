# whatsapp-bot-shifting
whatsapp-bot-shifting

🚀 Panduan Deploy ke Railway
Berikut adalah langkah-langkah untuk mendeploy bot WhatsApp ini ke Railway, lengkap dengan semua konfigurasi yang diperlukan.

1. Persiapan File Konfigurasi
Pastikan file-file berikut ada dan sudah benar di dalam proyek kamu sebelum di-push ke GitHub.

A. package.json (Start Script)
Pastikan start script kamu menggunakan node (bukan nodemon) dan tidak menyertakan --env-file. Railway akan menyuntikkan variables secara otomatis.

JSON

"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon --env-file=.env src/index.js"
},
"engines": {
  "node": ">=20.0.0"
}
B. nixpacks.toml (Dependensi Sistem)
Buat file ini di folder root proyek untuk meng-install library sistem yang dibutuhkan oleh Puppeteer (Chromium).

Ini, TOML

# nixpacks.toml

[phases.setup]
# Menambahkan library sistem yang dibutuhkan oleh Puppeteer/Chromium
aptPkgs = [
  "chromium",
  "libnss3",
  "libatk1.0-0",
  "libatk-bridge2.0-0",
  "libcups2",
  "libgtk-3-0",
  "libgbm-dev",
  "libasound2t64",
  "libgobject-2.0-0"
]
C. src/whatsappClient.js (Port Dinamis)
Pastikan server Socket.IO kamu menggunakan process.env.PORT yang diberikan oleh Railway.

JavaScript

// src/whatsappClient.js
import { Server } from 'socket.io';

// Baca port dari Railway, jika tidak ada (lokal), gunakan 3001
const PORT = process.env.PORT || 3001; 

const io = new Server(PORT, {
  cors: {
    origin: '*', // Sesuaikan di produksi nanti
  },
});
console.log(`📡 Server Socket.IO berjalan di port ${PORT}`);
D. .gitignore (Keamanan Sesi)
Pastikan kamu mengabaikan folder session agar tidak ter-push ke GitHub.

Cuplikan kode

# Folder sesi WhatsApp
/session/

# File environment
.env

# Folder dependensi
/node_modules/
2. Setup di Dashboard Railway
Setelah semua kode di-push ke GitHub:

Buat Proyek: Buat proyek baru di Railway dan hubungkan ke repositori GitHub kamu.

Atur Builder:

Buka tab Settings di layanan (service) kamu.

Scroll ke bagian Build.

Pastikan Builder diatur ke Nixpacks.

Tambahkan Variables:

Buka tab Variables.

Tambahkan semua environment variables kamu, terutama:

SUPABASE_URL: (URL Supabase kamu)

SUPABASE_KEY: (Kunci Supabase kamu)

Tambahkan Volume (Wajib):

Buka tab Settings.

Scroll ke bagian Volumes.

Klik Add Volume (atau New Volume).

Isi Mount Path dengan: ./session

Klik di luar kotak (atau tekan Enter). Ini akan tersimpan otomatis.

Buat URL Publik:

Buka tab Settings.

Scroll ke bagian Networking.

Klik **Generate Domain