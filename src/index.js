// src/index.js
import { startScheduler } from "./scheduler.js";
// Impor dari file baru kita
import { initWhatsApp } from "./whatsappClient.js"; 

const main = () => {
  try {
    console.log("🚀 Memulai bot...");

    // 1. Inisialisasi WhatsApp Client (ini akan berjalan selamanya)
    // Fungsi ini sekarang juga otomatis menyalakan server Socket.IO
    initWhatsApp(); 

    // 2. Jalankan scheduler harian
    // Scheduler akan mengimpor 'sendMessage' secara mandiri
    startScheduler();

  } catch (error) {
    console.error("❌ Gagal memulai bot:", error.message);
  }
};

// Jalankan fungsi main
main();