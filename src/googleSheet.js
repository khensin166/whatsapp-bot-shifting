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

  // Ambil range yang lebar (sampai AZ)
  const range = `${currentTabName}!A4:AZ100`;

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

    // --- INI DIA PERUBAHAN UTAMANYA ---
    const headerRow = rows[0]; // Sheet Row 4 (berisi "Nama", "PN", "1", "2", "3"...)
    const userDataRows = rows.slice(1); // Sheet Row 5 (data user)

    // 1. Cari index kolom "Nama" secara dinamis
    const nameColIndex = headerRow.findIndex(
      (header) => String(header).trim().toLowerCase() === 'nama'
    );

    if (nameColIndex === -1) {
      throw new Error(
        `Tidak dapat menemukan header 'Nama' di baris 4 pada tab '${currentTabName}'.`
      );
    }
    console.log(
      `Header 'Nama' ditemukan secara dinamis di index kolom: ${nameColIndex}`
    );

    // 2. Cari index kolom tanggal "1" secara dinamis
    const dateStartIndex = headerRow.findIndex(
      (header) => String(header).trim() === '1'
    );

    if (dateStartIndex === -1) {
      throw new Error(
        `Tidak dapat menemukan header tanggal '1' di baris 4 pada tab '${currentTabName}'.`
      );
    }
    console.log(
      `Header tanggal '1' ditemukan secara dinamis di index kolom: ${dateStartIndex}`
    );
    // --- AKHIR PERUBAHAN ---

    const allShifts = [];

    for (const row of userDataRows) {
      // PERBAIKAN: Gunakan 'nameColIndex' dinamis, bukan 'row[1]'
      const userName = row[nameColIndex];
      if (!userName || userName.trim() === '') continue; // Lewati jika nama kosong

      // Gunakan 'dateStartIndex' dinamis sebagai awal loop
      for (
        let colIndex = dateStartIndex;
        colIndex < headerRow.length;
        colIndex++
      ) {
        const day = headerRow[colIndex];
        const shiftType = row[colIndex];

        // Pastikan 'day' adalah angka dan 'shiftType' ada isinya
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