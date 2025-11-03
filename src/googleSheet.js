// src/googleSheet.js
import { google } from 'googleapis';

const sheets = google.sheets({
  version: 'v4',
  auth: process.env.GOOGLE_API_KEY_SPREADSHEET,
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

export const fetchShiftData = async () => {
  console.log('🔄 Membaca Google Sheet...');

  const now = new Date();
  const currentYear = now.getFullYear();
  const timeZone = 'Asia/Jakarta';

  const monthName = now
    .toLocaleString('id-ID', { month: 'long', timeZone })
    .toUpperCase();
  const shortYear = now.toLocaleString('id-ID', {
    year: '2-digit',
    timeZone,
  });

  const currentTabName = `${monthName}'${shortYear}`;

  // --- PERBAIKAN 1: Baca range mulai dari BARIS 3 ---
  const range = `${currentTabName}!A3:AZ100`;

  console.log(`Mencoba membaca dari tab: ${currentTabName} (Range: ${range})`);

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    // --- PERBAIKAN 2: Logika Parser Header Ganda ---
    if (!rows || rows.length < 4) { // Butuh 3 baris header (3,4,5) + 1 baris data
      console.log('Data sheet tidak lengkap (kurang dari 4 baris).');
      return [];
    }

    // Pisahkan TIGA baris header
    const staticHeaderRow = rows[0]; // Ini adalah Sheet Row 3 (berisi "Nama", "PN"...)
    const dateHeaderRow = rows[1];   // Ini adalah Sheet Row 4 (berisi "1", "2", "3"...)
    // const dayNameRow = rows[2];    // Ini Sheet Row 5 (Fungsi, Sab, Min... KITA ABAIKAN)
    const userDataRows = rows.slice(3);  // Data user dimulai dari Sheet Row 6 (index 3)

    // 1. Cari index "Nama" di Baris 3
    const nameColIndex = staticHeaderRow.findIndex(
      (header) => String(header).trim().toLowerCase() === 'nama'
    );

    if (nameColIndex === -1) {
      throw new Error(
        `Tidak dapat menemukan header 'Nama' di baris 3 pada tab '${currentTabName}'.`
      );
    }
    console.log(
      `Header 'Nama' ditemukan di index kolom: ${nameColIndex}`
    );

    // 2. Cari index "1" di Baris 4
    const dateStartIndex = dateHeaderRow.findIndex(
      (header) => String(header).trim() === '1'
    );

    if (dateStartIndex === -1) {
      throw new Error(
        `Tidak dapat menemukan header tanggal '1' di baris 4 pada tab '${currentTabName}'.`
      );
    }
    console.log(
      `Header tanggal '1' ditemukan di index kolom: ${dateStartIndex}`
    );
    // --- AKHIR PERBAIKAN ---

    const allShifts = [];

    for (const row of userDataRows) {
      // Ambil nama dari index kolom "Nama"
      const userName = row[nameColIndex];
      if (!userName || userName.trim() === '') continue; // Lewati jika nama kosong

      // Loop menggunakan header tanggal dari Baris 4
      for (
        let colIndex = dateStartIndex;
        colIndex < dateHeaderRow.length; // Loop sepanjang baris tanggal
        colIndex++
      ) {
        const day = dateHeaderRow[colIndex]; // Ambil 'day' dari Row 4
        const shiftType = row[colIndex];     // Ambil 'shiftType' dari baris user

        if (
          day &&
          !isNaN(parseInt(day)) &&
          shiftType &&
          String(shiftType).trim() !== ''
        ) {
          const date = new Date(
            Date.UTC(currentYear, now.getMonth(), parseInt(day))
          );
          const dateString = date.toISOString().split('T')[0];

          allShifts.push({
            name: userName.trim(),
            date: dateString,
            shift_type: String(shiftType).trim(),
          });
        }
      }
    }

    console.log(`✅ Berhasil mem-parsing ${allShifts.length} data shift.`);
    return allShifts;

  } catch (err) {
    if (err.message.includes('Unable to parse range')) {
      console.warn(
        `⚠️ Tab sheet '${currentTabName}' tidak ditemukan. Melewatkan...`
      );
      return [];
    }
    console.error('❌ Gagal mengambil data Google Sheet:', err.message);
    throw err;
  }
};