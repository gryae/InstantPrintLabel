# PrintLabel — .exe Build Guide

Folder ini khusus untuk mempackage **PrintLabel** jadi Windows `.exe`.
**Source code asli di `/src` tidak diubah sama sekali.**

---

## 📁 Struktur Folder

```
exe-build/
├── build.js          ← Orchestration script (jalankan ini untuk build)
├── launcher.js       ← Entry point yang dibundle jadi .exe
├── package.json      ← Dependencies khusus build (pkg)
├── pkg.config.json   ← Konfigurasi pkg bundler
├── README.md         ← File ini
└── dist/             ← Output hasil build (auto-generated)
    ├── PrintLabel.exe
    └── uploads/
```

---

## 🚀 Cara Build .exe

### Prasyarat
- Node.js v18+ terinstall di PC build
- Sudah pernah `npm install` di root project

### Langkah-langkah

1. **Buka terminal**, masuk ke folder `exe-build/`:
   ```powershell
   cd exe-build
   ```

2. **Jalankan build script**:
   ```powershell
   node build.js
   ```

3. **Tunggu** hingga selesai (5–10 menit pertama kali karena download Node binary).

4. **Output** ada di `exe-build/dist/`:
   ```
   dist/
   ├── PrintLabel.exe   ← ini yang didistribusikan
   └── uploads/         ← folder ini harus ikut!
   ```

---

## 📦 Cara Distribusi ke User

Kirim/copy seluruh folder `dist/` ke komputer target:

```
PrintLabel/
├── PrintLabel.exe   ← double-click untuk jalankan
└── uploads/         ← WAJIB ada di folder yang sama!
```

User cukup **double-click `PrintLabel.exe`** — browser akan terbuka otomatis.

---

## ⚙️ Konfigurasi

Edit file `.env` default di `launcher.js` jika perlu ganti:
- `PORT` — default: `3001`
- `SESSION_SECRET` — ganti untuk production

---

## ⚠️ Catatan Penting

- File `.exe` yang dihasilkan **sudah include Node.js runtime** — user tidak perlu install Node.js
- Folder `uploads/` harus **selalu ada di sebelah** `.exe` karena file upload disimpan di sana
- Ukuran `.exe` sekitar **40–60 MB** (sudah include Node runtime)
- App tetap berjalan di browser (localhost), bukan window desktop sendiri
