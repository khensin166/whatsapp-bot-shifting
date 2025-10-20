// src/sendMessage.js
import puppeteer from "puppeteer";

let browser, page;

// FUNGSI INI SUDAH SEMPURNA, JANGAN DIUBAH LAGI
export const initWhatsApp = async () => {
  console.log("📲 Membuka WhatsApp Web...");
  browser = await puppeteer.launch({
    headless: true, 
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1920,1980",
    ],
    userDataDir: "./session",
  });

  page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );
  
  await page.goto("https://web.whatsapp.com");

  try {
    const loginSelector = "div#pane-side"; 
    const qrCodeSelector = "canvas[aria-label='Scan me!']";
    console.log("... Menunggu QR code atau panel chat (timeout 2 menit)...");
    
    await Promise.race([
      page.waitForSelector(loginSelector, { timeout: 120000 }),
      page.waitForSelector(qrCodeSelector, { timeout: 120000 }),
    ]);

    const isQrCodeVisible = (await page.$(qrCodeSelector)) !== null;
    if (isQrCodeVisible) {
      console.log("📱 Silakan scan QR code untuk login...");
      await page.waitForSelector(loginSelector, { timeout: 0 }); 
      console.log("✅ Login berhasil!");
    } else {
      console.log("✅ Login berhasil menggunakan session yang tersimpan.");
    }
  } catch (err) {
    console.error("❌ Gagal login (timeout 2 menit):", err.message);
    throw err; 
  }
  return page;
};

// === PERBAIKAN FUNGSI page.waitForTimeout ===
export const sendMessage = async (phone, message) => {
  if (!page) {
    console.log("⚠️ WhatsApp belum siap, inisialisasi dulu.");
    return;
  }

  try {
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
      message
    )}&app_absent=0`;

    // 1. Pergi ke URL dan tunggu halaman 'diam'
    await page.goto(url, { waitUntil: 'networkidle0' });
    console.log("... (1/2) Halaman URL dimuat. Menunggu 7 detik untuk render...");

    // 2. PERBAIKAN: Ganti page.waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 7000)); // 7 detik

    // 3. Langsung TEKAN ENTER
    await page.keyboard.press('Enter');
    console.log("... (2/2) Menekan tombol Enter...");

    // 4. PERBAIKAN: Ganti page.waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 3000)); // Waktu untuk pesan terkirim

    console.log(`✅ Pesan terkirim ke ${phone}: "${message.substring(0, 20)}..."`);
    
  } catch (err)
 {
    console.error(`❌ Gagal kirim pesan ke ${phone}:`, err.message);
    throw err; 
  }
};