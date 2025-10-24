// src/whatsappClient.js
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { Server } from 'socket.io';
import { startScheduler } from './scheduler.js';

// 1. Inisialisasi Server Socket.IO
// Ini adalah "telepon" yang akan mengirim QR ke web Vue-mu
const PORT = process.env.PORT || 3001; 

const io = new Server(PORT, { // <-- SEKARANG SUDAH DINAMIS
  cors: {
    origin: '*', // Izinkan koneksi dari web client-mu
  },
});
console.log(`📡 Server Socket.IO berjalan di port ${PORT}`);

// 2. Inisialisasi WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }), // Ini akan OTOMATIS menggunakan folder .session kamu!
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  },
});

// 3. Fungsi Inisialisasi Utama
export const initWhatsApp = () => {
  console.log('📲 Menginisialisasi WhatsApp Client...');

  // Event saat QR code dibuat
  client.on('qr', (qr) => {
    console.log('QR Code diterima, mengirim ke web client...');
    // Kirim data QR code ke web Vue-mu
    io.emit('qr_code', qr);
  });

  // === PERUBAHAN DI SINI ===
  // Event saat berhasil login
  // 1. Tambahkan 'async' di sini
  client.on('ready', async () => { 
    console.log('✅ WhatsApp Client siap!');
    io.emit('status', 'WhatsApp Terhubung!');

    // 2. KIRIM PESAN OTOMATIS KE BANYAK NOMOR
    console.log('📤 Mengirim notifikasi startup ke admin...');
      
    // 1. Tentukan daftar nomor admin dalam sebuah array
    const adminNumbers = [
      "6285264351660",
      "6282173230659" 
    ];
    
    const message = "✅ Bot shift otomatis berhasil dijalankan & terhubung!";

    // 2. Loop setiap nomor dan kirim pesan
    for (const phone of adminNumbers) {
      try {
        const chatId = `${phone}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`✅ Notifikasi startup terkirim ke ${phone}`);
        
        // 3. (PENTING) Beri jeda 2 detik antar pesan agar tidak di-spam
        // 2000 milidetik = 2 detik
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        
      } catch (err) {
        // Jika 1 nomor gagal, log error dan lanjut ke nomor berikutnya
        console.error(`❌ Gagal kirim notifikasi startup ke ${phone}:`, err.message);
      }
    }
    
      // Setelah WA siap dan notif terkirim, BARU jalankan scheduler
      console.log("-> 🏁 Memulai Scheduler sekarang setelah WA siap...");
      startScheduler(); 
      // --- AKHIR DARI PERUBAHAN ---
  });

  // Event saat koneksi terputus
  client.on('disconnected', (reason) => {
    console.log('⚠️ Client terputus:', reason);
    io.emit('status', 'WhatsApp Terputus!');
  });

  // Mulai client
  client.initialize();
};

// 4. Fungsi Kirim Pesan (Versi Baru)
export const sendMessage = async (phone, message) => {
  try {
    // whatsapp-web.js butuh format nomor seperti ini
    const chatId = `${phone}@c.us`; 
    
    await client.sendMessage(chatId, message);
    console.log(`✅ Pesan terkirim ke ${phone}`);
  } catch (err) {
    console.error(`❌ Gagal kirim pesan ke ${phone}:`, err.message);
  }
};