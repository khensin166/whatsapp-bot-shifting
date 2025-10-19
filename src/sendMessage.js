import puppeteer from "puppeteer";

let browser, page;

export const initWhatsApp = async () => {
  console.log("📲 Membuka WhatsApp Web...");
  browser = await puppeteer.launch({
  headless: false,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  userDataDir: "./session", // folder untuk simpan session WA
});

  page = await browser.newPage();
  await page.goto("https://web.whatsapp.com");
  console.log("📱 Silakan scan QR code untuk login WhatsApp Web...");

  await page.waitForSelector("canvas", { timeout: 0 });
  await page.waitForSelector("._3ndVb", { timeout: 0 }); // tanda login selesai
  console.log("✅ Login berhasil!");
  return page;
};

export const sendMessage = async (phone, message) => {
  if (!page) {
    console.log("⚠️ WhatsApp belum siap, inisialisasi dulu.");
    return;
  }

  const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
    message
  )}&app_absent=0`;

  await page.goto(url);
  await page.waitForSelector("div[title='Ketik pesan']", { timeout: 60000 });
  await page.waitForTimeout(5000); // beri waktu chat loading

  // tekan tombol kirim menggunakan XPath yang kamu temukan
  const sendButtonXPath =
    "/html/body/div[1]/div/div/div[1]/div/div[3]/div/div[4]/div/footer/div[1]/div/span/div/div[2]/div/div[4]/div/span/div/div/div[1]";
  const [sendButton] = await page.$x(sendButtonXPath);

  if (sendButton) {
    await sendButton.click();
    console.log(
      `✅ Pesan terkirim ke ${phone}: "${message}"`
    );
  } else {
    console.log("⚠️ Tombol kirim tidak ditemukan!");
  }
};
