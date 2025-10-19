// import "dotenv/config";
// import { sendMessage } from "./sendMessage.js";
// import { startScheduler } from "./scheduler.js";

// console.log("🚀 Server running on port 3000");

// // Jalankan scheduler otomatis
// startScheduler();

// // Kirim pesan otomatis saat startup (indikator bot aktif)
// const notifyStartup = async () => {
//   try {
//     const phone = "6285264351660"; // Nomor kamu sendiri
//     const message = "✅ Bot shift otomatis berhasil dijalankan di server!";
//     await sendMessage(phone, message);
//     console.log("📩 Notifikasi startup terkirim!");
//   } catch (err) {
//     console.error("⚠️ Gagal kirim notifikasi startup:", err.message);
//   }
// };

// notifyStartup();

import "dotenv/config";
import { startScheduler } from "./scheduler.js";
import { sendMessage } from "./sendMessage.js";

console.log("🚀 Server running on port 3000");
startScheduler();

const test = async () => {
  try {
    // Tunggu 5 detik setelah login sebelum kirim pesan
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const phone = "6285264351660";
    const message = "Halo! Ini tes otomatis dari bot shift 🚀";

    console.log("📤 Mengirim notifikasi startup...");
    await sendMessage(phone, message);
    console.log("✅ Notifikasi startup terkirim!");
  } catch (error) {
    console.error("⚠️ Gagal kirim notifikasi startup:", error.message);
  }
};

test();
