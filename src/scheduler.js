// src/scheduler.js
import cron from "node-cron";
import { supabase } from "./supabase.js";
import { sendMessage } from "./sendMessage.js";

export function startScheduler() {
  console.log("🕒 Scheduler started...");

  // Jalankan setiap hari jam 05:00 WIB
  cron.schedule("0 5 * * *", async () => {
    console.log("🚀 Running daily WhatsApp notifications...");
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { data: shifts, error } = await supabase
      .from("shifts")
      .select("id, date, shift_type, employees(name, phone)")
      .eq("date", today);

    if (error) {
      console.error("❌ Supabase error:", error);
      return;
    }

    if (!shifts || shifts.length === 0) {
      console.log("✅ No shifts for today");
      return;
    }

    for (const shift of shifts) {
      const name = shift.employees.name;
      const phone = shift.employees.phone;
      const shiftType = shift.shift_type;

      const msg = `Halo ${name}! 👋\nKamu dijadwalkan untuk *Shift ${shiftType}* hari ini (${today}).\nSemangat bekerja! 💪`;

      try {
        await sendMessage(phone, msg);
      } catch (err) {
        console.error(`⚠️ Gagal kirim ke ${name}:`, err.message);
      }
    }
  });
}
