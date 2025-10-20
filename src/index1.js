// src/index.js
import { startScheduler } from "./scheduler.js";
// Impor KEDUA fungsi dari sendMessage.js
import { initWhatsApp, sendMessage } from "./sendMessage.js"; 

// Fungsi main untuk inisialisasi
const main = async () => {
  try {
    console.log("🚀 Memulai bot...");
    // 1. Buka WhatsApp dan tunggu sampai login
    await initWhatsApp(); 
    console.log("✅ Bot siap menerima perintah.");

    // 2. Kirim notifikasi startup (opsional, tapi bagus)
    console.log("📤 Mengirim notifikasi startup...");
    await sendMessage("6285762535657", "✅ Bot shift otomatis berhasil dijalankan!");
    console.log("✅ Notifikasi startup terkirim!");

    // 3. Jalankan scheduler harian
    startScheduler();

  } catch (error) {
    console.error("❌ Gagal memulai bot:", error.message);
  }
};

// Jalankan fungsi main
main();