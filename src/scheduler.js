// src/scheduler.js
import cron from "node-cron";
import { supabase } from "./supabase.js";
import { sendMessage } from "./whatsappClient.js";
import { fetchShiftData } from "./googleSheet.js";

/**
 * Job 1: Sinkronisasi Google Sheet ke Supabase setiap tengah malam.
 */
const syncGoogleSheetToSupabase = async () => {
  console.log("🌙 Menjalankan sinkronisasi harian Google Sheet...");
  try {
    const shiftsFromSheet = await fetchShiftData();
    if (!shiftsFromSheet || shiftsFromSheet.length === 0) {
      console.log("Tidak ada data dari sheet untuk disinkronkan.");
      return;
    }

    // 1. Ambil semua user dari DB
    const { data: users, error: userError } = await supabase
      .from("User")
      .select("id, name");

    if (userError) throw userError;

    // --- TAMBAHAN LOGGING 1 ---
    console.log(`Ditemukan ${users.length} user di DB.`);
    if (users.length === 0) {
      console.error(
        "❌ Tidak ada user di tabel User DB. Sinkronisasi tidak bisa dilanjutkan."
      );
      sendMessage(
        "6285264351660",
        `⚠️ Bot Gagal Sinkronisasi: Tabel User di DB kosong.`
      );
      return;
    }
    // --- AKHIR LOGGING 1 ---

    // --- PERUBAHAN LOGIKA PENCARIAN (DIMULAI DI SINI) ---
    // 1. Buat daftar user DB, di-lowercase, dan DIURUTKAN
    //    Ini penting agar nama yang lebih panjang (misal: "kenan")
    //    dicek lebih dulu daripada nama yang pendek (misal: "ken").
    const dbUsers = users
      .filter((u) => u.name) // Hanya proses user yang punya nama
      .map((u) => ({ id: u.id, nameLower: u.name.toLowerCase() }))
      .sort((a, b) => b.nameLower.length - a.nameLower.length); // Urutkan dari terpanjang

    console.log("Contoh user DB (diurutkan berdasarkan panjang nama):");
    for (let i = 0; i < Math.min(dbUsers.length, 3); i++) {
      console.log(`- "${dbUsers[i].nameLower}": "${dbUsers[i].id}"`);
    }

    // 2. Ubah data sheet menjadi format Supabase
    const shiftsToUpsert = shiftsFromSheet
      .map((sheetRow) => {
        if (!sheetRow || !sheetRow.name) {
          return null; // Abaikan baris sheet jika nama kosong
        }

        const sheetNameLower = sheetRow.name.trim().toLowerCase();

        // 2. Cari user DB yang namanya 'terkandung' di dalam nama sheet
        const matchedUser = dbUsers.find((dbUser) =>
          sheetNameLower.includes(dbUser.nameLower)
        );

        if (!matchedUser) {
          // console.warn(`⚠️ User untuk '${sheetRow.name.trim()}' tidak ditemukan di DB.`);
          return null; // Skip jika tidak ada user DB yang cocok
        }

        // Ditemukan! (misal "kenan tomfie bukit" .includes("kenan"))
        return {
          userId: matchedUser.id,
          date: sheetRow.date,
          shift_type: sheetRow.shift_type,
        };
      })
      .filter(Boolean); // Hapus data null (user tidak ditemukan)
    // --- AKHIR PERUBAHAN LOGIKA PENCARIAN ---

    // --- TAMBAHAN LOGGING 3 ---
    console.log(
      `Jumlah shift yang valid (user ditemukan): ${shiftsToUpsert.length} dari ${shiftsFromSheet.length}`
    );
    // --- AKHIR LOGGING 3 ---

    // --- TAMBAHAN PENTING DI SINI ---
    if (shiftsToUpsert.length === 0) {
      console.warn(
        "❌ Tidak ada shift valid yang bisa disinkronkan (semua user tidak ditemukan di DB). Lewati proses upsert."
      );
      // Kirim notifikasi jika perlu, tapi JANGAN lanjut ke upsert
      sendMessage(
        "6285264351660",
        `⚠️ Bot Gagal Sinkronisasi: Tidak ada user di Sheet yang cocok dengan DB.`
      );
      return; // Hentikan fungsi di sini
    }
    // --- AKHIR TAMBAHAN ---

    // 3. Simpan (Upsert) ke tabel UserShift
    // --- PERBAIKAN UNTUK ERROR 1 ---
    // Ganti 'user_id, date' menjadi 'userId, date'
    const { error: upsertError } = await supabase
      .from("UserShift")
      .upsert(shiftsToUpsert, { onConflict: "userId, date" }); // Sesuaikan dengan unique constraint di Prisma

    if (upsertError) {
      // --- TAMBAHAN LOGGING 4 ---
      console.error(
        "Detail Error Upsert:",
        JSON.stringify(upsertError, null, 2)
      );
      // --- AKHIR LOGGING 4 ---
      throw upsertError; // Lempar error lagi setelah log
    }

    console.log(`✅ Sinkronisasi ${shiftsToUpsert.length} shift selesai.`);
  } catch (error) {
    console.error("❌ Gagal melakukan sinkronisasi harian:", error.message);
    // Kirim notifikasi error ke admin
    sendMessage(
      "6285264351660",
      `⚠️ Bot Gagal Sinkronisasi Harian: ${error.message}`
    );
  }
};

/**
 * Job 2: Cek pengingat setiap 10 menit.
 * (Kode ini sudah benar dan berfungsi)
 */
const checkReminders = async () => {
  // Dapatkan waktu Jakarta saat ini (misal: "04:30")
  const now = new Date();
  const timeZone = "Asia/Jakarta";
  const currentTime = now.toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  });
  const currentDate = now.toLocaleDateString("en-CA", { timeZone }); // Format YYYY-MM-DD

  console.log(`⏰ Mengecek pengingat untuk: ${currentDate} ${currentTime}`);

  try {
    // 1. Cari aktivitas yang reminder_time-nya cocok dengan waktu sekarang
    const { data: activities, error: activityError } = await supabase
      .from("ShiftActivity")
      .select("*")
      .eq("reminder_time", currentTime);

    if (activityError) throw activityError;
    if (!activities || activities.length === 0) {
      // console.log('Tidak ada aktivitas untuk diingatkan saat ini.');
      return;
    }

    // 2. Untuk setiap aktivitas yang cocok...
    for (const activity of activities) {
      console.log(
        `🔔 Aktivitas ditemukan: ${activity.activity_name} (Shift ${activity.shift_type})`
      );

      // --- TAMBAHAN LOGGING 1 ---
      console.log(
        ` -> Mencari user dengan shift ${activity.shift_type} pada ${currentDate}...`
      );
      // --- AKHIR LOGGING 1 ---

      // 3. ...cari semua user yang shift-nya cocok HARI INI
      // --- PERBAIKAN UNTUK ERROR 1 (jaga-jaga) ---
      // Pastikan join ke 'User' menggunakan 'userId'
      const { data: usersOnShift, error: shiftError } = await supabase
        .from("UserShift")
        .select("User (id, name, phone_number)")
        .eq("date", currentDate)
        .eq("shift_type", activity.shift_type);

      if (shiftError) throw shiftError;
      // --- TAMBAHAN LOGGING 2 & PERBAIKAN KONDISI ---
      if (!usersOnShift || usersOnShift.length === 0) {
        console.log(
          ` -> Tidak ada user yang ditemukan untuk shift ${activity.shift_type} hari ini.`
        );
        continue;
      } else {
        console.log(` -> Ditemukan ${usersOnShift.length} user.`);
      }
      // --- AKHIR LOGGING 2 ---

      // 4. ...kirim pesan ke setiap user yang shift-nya cocok
      for (const shift of usersOnShift) {
        const user = shift.User;
        // --- TAMBAHAN LOGGING 3 & PERBAIKAN KONDISI ---
        if (!user) {
          console.log(` -> User data tidak lengkap untuk shift ini.`);
          continue;
        }
        if (!user.phone_number) {
          console.log(
            ` -> User ${user.name} dilewati karena phone_number kosong.`
          );
          continue;
        }
        // --- AKHIR LOGGING 3 ---

        // 5. Cek apakah sudah pernah kirim log hari ini
        const todayStart = `${currentDate}T00:00:00.000Z`;
        // --- PERBAIKAN UNTUK ERROR 1 (jaga-jaga) ---
        const { data: existingLog, error: logError } = await supabase
          .from("NotificationLog")
          .select("id")
          .eq("userId", user.id) // Ganti ke userId
          .eq("activityId", activity.id) // Ganti ke activityId
          .gte("sent_at", todayStart);

        if (logError) throw logError;

        if (!existingLog || existingLog.length === 0) {
          console.log(`📤 Mengirim pengingat ke ${user.name}...`);

          const message = `🔔 Pengingat Aktivitas
Halo ${user.name}! Waktunya untuk "${activity.activity_name}" sebentar lagi 🍽️
Jam: ${activity.time_start} (Shift ${activity.shift_type})
Catatan: ${activity.note || "-"}`;

          await sendMessage(user.phone_number, message);

          // 6. Catat ke NotificationLog
          // --- PERBAIKAN UNTUK ERROR 1 (jaga-jaga) ---
          await supabase
            .from("NotificationLog")
            .insert({ userId: user.id, activityId: activity.id }); // Ganti ke userId & activityId
        } else {
          // --- TAMBAHAN LOGGING 4 ---
          console.log(
            ` -> Skipping ${user.name}, notifikasi sudah terkirim hari ini (Log ID: ${existingLog[0].id}).`
          );
          // --- AKHIR LOGGING 4 ---
        }
      }
    }
  } catch (error) {
    console.error("❌ Gagal mengecek pengingat:", error.message);
  }
};

// Fungsi utama untuk memulai semua scheduler
export function startScheduler() {
  console.log("🕒 Menjalankan scheduler baru...");

  // 1. Jalankan sinkronisasi harian setiap jam 00:05 WIB
  cron.schedule("5 0 * * *", syncGoogleSheetToSupabase, {
    timezone: "Asia/Jakarta",
  });
  console.log("-> 📅 Job sinkronisasi harian (00:05) terdaftar.");

  // 2. Jalankan pengecekan pengingat setiap 10 menit
  cron.schedule("*/10 * * * *", checkReminders, {
    timezone: "Asia/Jakarta",
  });
  console.log("-> ⏰ Job pengecekan pengingat (setiap 10 menit) terdaftar.");

  // Jalankan pengecekan 1x saat startup untuk tes
  console.log("-> 🚀 Menjalankan pengecekan pengingat 1x saat startup...");
  checkReminders();

  // Jalankan sinkronisasi 1x saat startup untuk tes
  console.log("-> 📄 Menjalankan sinkronisasi Google Sheet 1x saat startup...");
  syncGoogleSheetToSupabase();
}
