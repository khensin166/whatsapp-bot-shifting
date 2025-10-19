// src/sendMessage.js
import puppeteer from "puppeteer";

export const sendMessage = async (phone, message) => {
  console.log("📲 Membuka WhatsApp Web...");

  const browser = await puppeteer.launch({
    headless: false, // HARUS false agar Chrome muncul
    userDataDir: "./session", // agar login tersimpan
  });

  const page = await browser.newPage();
  await page.goto("https://web.whatsapp.com");

  console.log("📱 Silakan scan QR code untuk login WhatsApp Web...");

  // Tunggu hingga login berhasil (ada elemen sidebar chat)
  await page.waitForSelector("#side", { timeout: 0 });
  console.log("✅ Login berhasil!");

  // Kirim pesan
  const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  await page.goto(url);

  await page.waitForSelector("div[aria-label='Ketik pesan']");
  await page.keyboard.press("Enter");
  console.log(`✅ Pesan terkirim ke ${phone}: ${message}`);

  // Jangan langsung tutup browser, biar bisa lihat hasilnya
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
};
