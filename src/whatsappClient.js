// src/whatsappClient.js
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { Server } from 'socket.io';

// 1. Inisialisasi Server Socket.IO
// Ini adalah "telepon" yang akan mengirim QR ke web Vue-mu
const io = new Server(3001, {
  cors: {
    origin: '*', // Izinkan koneksi dari web client-mu
  },
});
console.log('📡 Server Socket.IO berjalan di port 3001');

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

  // Event saat berhasil login
  client.on('ready', () => {
    console.log('✅ WhatsApp Client siap!');
    // Kirim status ke web Vue-mu
    io.emit('status', 'WhatsApp Terhubung!');
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