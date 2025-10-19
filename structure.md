whatsapp-bot/
├── src/
│   ├── index.js          # Entry point utama (Express server + scheduler)
│   ├── scheduler.js      # Jadwal kirim pesan otomatis
│   ├── sendMessage.js    # Fungsi untuk kirim pesan WhatsApp via Puppeteer
│   ├── supabase.js       # Koneksi Supabase (biar tidak campur di file lain)
│   └── utils/
│       └── logger.js     # (opsional) logging helper
├── .env                  # Konfigurasi rahasia (Supabase key, dsb)
├── package.json
└── README.md
