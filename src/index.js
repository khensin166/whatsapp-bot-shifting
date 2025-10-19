import "dotenv/config";
import { sendMessage } from "./sendMessage.js";
import { startScheduler } from "./scheduler.js";

console.log("🚀 Server running on port 3000");

// Jalankan scheduler otomatis
startScheduler();

// Tes kirim pesan sekali saat server start
const test = async () => {
  const phone = "6285264351660";
  const message = "Halo! Ini tes dari bot shift otomatis 🚀";
  await sendMessage(phone, message);
};

test();
