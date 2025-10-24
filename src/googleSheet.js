// src/googleSheet.js
import { google } from 'googleapis';

// 1. Inisialisasi Klien
const sheets = google.sheets({
  version: 'v4',
  auth: process.env.GOOGLE_API_KEY_SPREADSHEET,
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

/**
 * Mengambil jadwal shift dari Google Sheet.
 */
export const fetchShiftData = async () => {
  console.log('🔄 Membaca Google Sheet...');

  const now = new Date();
  const currentYear = now.getFullYear();
  const timeZone = 'Asia/Jakarta';

  // Format nama tab (misal: "OKTOBER'25")
  const monthName = now.toLocaleString('id-ID', { month: 'long', timeZone }).toUpperCase();
  const shortYear = now.toLocaleString('id-ID', { year: '2-digit', timeZone });
  
  // PERBAIKAN 1: Hapus spasi agar cocok dengan log 'OKTOBER'25'
  const currentTabName = `${monthName}'${shortYear}`; 

  // PERBAIKAN 2: Range dimulai dari A4 (header tanggal), bukan A3
  const range = `${currentTabName}!A4:AF100`; 

  console.log(`Mencoba membaca dari tab: ${currentTabName} (Range: ${range})`);

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) { 
      console.log('Tidak ada data ditemukan di sheet.');
      return [];
    }

    // PERBAIKAN 3: Header tanggal ada di 'rows[0]' (Sheet Row 4)
    const dateHeaders = rows[0]; 
    // PERBAIKAN 4: Data user dimulai dari 'rows[1]' (Sheet Row 5)
    const userDataRows = rows.slice(1); 

    const allShifts = []; 

    for (const row of userDataRows) {
      const userName = row[1]; // Kolom B (index 1) = Nama (Ini sudah benar)
      if (!userName) continue; 

      // PERBAIKAN 5: Loop tanggal dimulai dari Kolom F (index 5)
      for (let colIndex = 5; colIndex < dateHeaders.length; colIndex++) {
        const day = dateHeaders[colIndex]; // "1", "2", "3"
        const shiftType = row[colIndex]; // "1", "2", "LS"

        // Pastikan 'day' adalah angka dan 'shiftType' ada isinya
        if (day && !isNaN(parseInt(day)) && shiftType) {
          const date = new Date(currentYear, now.getMonth(), parseInt(day));
          const dateString = date.toISOString().split('T')[0];

          allShifts.push({
            name: userName.trim(), // Tambahkan .trim() untuk hapus spasi
            date: dateString,
            shift_type: shiftType.trim(),
          });
        }
      }
    }

    console.log(`✅ Berhasil mem-parsing ${allShifts.length} data shift.`);
    return allShifts;

  } catch (err) {
    // Tangani jika range tidak ditemukan (misal: tab Januari'26 belum ada)
    if (err.message.includes('Unable to parse range')) {
       console.warn(`⚠️ Tab sheet '${currentTabName}' tidak ditemukan. Melewatkan...`);
       return [];
    }
    console.error('❌ Gagal mengambil data Google Sheet:', err.message);
    throw err;
  }
};