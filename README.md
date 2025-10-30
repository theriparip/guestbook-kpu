# 📖 Buku Tamu Digital - KPU Tasikmalaya

Aplikasi Buku Tamu Digital untuk KPU Kabupaten Tasikmalaya yang dilengkapi dengan fitur capture foto, manajemen data pengunjung, dan dashboard admin dengan statistik lengkap.

## ✨ Fitur Utama

### 🎯 Halaman Tamu
- **Capture Foto Real-time**: Menggunakan webcam untuk mengambil foto pengunjung
- **Form Pendaftaran Lengkap**: Nama, telepon, perusahaan/instansi, tujuan kunjungan
- **10 Jenis Layanan**: Pemutakhiran data pemilih, pencalonan, verifikasi partai, PPID, dll.
- **Autentikasi Kata Kunci**: Validasi kata kunci harian untuk mengisi buku tamu
- **UI Responsif**: Tampilan yang optimal di desktop dan mobile
- **Indonesian Localization**: Semua teks dan format tanggal dalam Bahasa Indonesia

### 🔐 Panel Admin
- **Dashboard Statistik**: Pengunjung hari ini, minggu ini, bulan ini, dan total
- **Analitik Lengkap**:
  - Top 5 Tujuan Kunjungan
  - Top 5 Perusahaan/Instansi
  - Petugas Piket Terbaik
  - Jam Sibuk (Peak Hours)
- **Manajemen Kata Kunci**: Update kata kunci harian dan nama petugas piket
- **Filter Data**: Hari ini, minggu ini, bulan ini, custom date range
- **Export Excel**: Download data pengunjung dalam format .xlsx
- **Pencarian**: Cari pengunjung berdasarkan nama, perusahaan, atau tujuan
- **Pagination**: Navigasi data yang mudah dengan pagination
- **Print Function**: Cetak laporan kunjungan
- **Hapus Data**: Kelola data pengunjung dengan tombol delete

## 🚀 Teknologi

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Webcam**: [react-webcam](https://www.npmjs.com/package/react-webcam)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Excel Export**: [SheetJS (xlsx)](https://sheetjs.com/)

## 📋 Prasyarat

Sebelum memulai, pastikan Anda telah menginstall:
- **Node.js** versi 18.x atau lebih tinggi
- **npm** atau **yarn** atau **pnpm**
- **Firebase Project** dengan Firestore Database enabled

## 🔧 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd guestbook-kpu
```

### 2. Install Dependencies

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Setup Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Buat project baru atau gunakan project yang sudah ada
3. Enable **Firestore Database**
4. Buka **Project Settings** > **General** > **Your apps**
5. Pilih **Web app** dan salin Firebase Configuration

### 4. Setup Environment Variables

Buat file `.env.local` di root folder dan isi dengan konfigurasi Firebase Anda:

```bash
# Copy dari .env.example
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_ADMIN_PASSWORD=your_strong_password_here
```

**⚠️ PENTING**: Ganti `NEXT_PUBLIC_ADMIN_PASSWORD` dengan password yang kuat!

### 5. Setup Firestore Database

Buat 2 collections di Firestore:

#### Collection: `guests`
Akan otomatis dibuat saat ada pengunjung pertama. Structure:
```
{
  nama: string
  telepon: string
  perusahaan: string
  tujuan: string
  photoURL: string (base64)
  timestamp: timestamp
  petugasPiket: string
}
```

#### Collection: `keywords`
Buat manual document pertama:
```
{
  keyword: "contoh"
  petugasPiket: "Nama Petugas"
  active: true
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 6. Jalankan Development Server

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk halaman tamu.

Buka [http://localhost:3000/admin](http://localhost:3000/admin) untuk panel admin.

## 📱 Penggunaan

### Halaman Tamu (/)

1. Klik **"Aktifkan Kamera"** untuk mengambil foto
2. Klik **"Ambil Foto"** setelah kamera aktif
3. Isi form dengan data lengkap:
   - Nama lengkap (required)
   - Nomor telepon
   - Perusahaan/Instansi
   - Tujuan kunjungan (required)
4. Masukkan **kata kunci** yang diberikan petugas
5. Klik **"Kirim Kunjungan"**

### Panel Admin (/admin)

1. Login dengan password yang sudah diatur di `.env.local`
2. **Dashboard**: Lihat statistik pengunjung secara real-time
3. **Atur Kata Kunci**: Update kata kunci harian dan nama petugas piket
4. **Daftar Tamu**:
   - Filter berdasarkan periode (hari ini, minggu ini, bulan ini, custom)
   - Cari pengunjung menggunakan search bar
   - Navigasi dengan pagination
   - Klik foto untuk melihat detail lengkap
   - Hapus data pengunjung jika diperlukan
5. **Export Excel**: Download data sesuai filter yang aktif
6. **Print**: Cetak laporan kunjungan

## 🏗️ Struktur Project

```
guestbook-kpu/
├── src/
│   ├── app/
│   │   ├── page.js              # Halaman tamu utama
│   │   ├── admin/
│   │   │   └── page.js          # Panel admin
│   │   ├── layout.js            # Root layout
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── GuestForm.jsx        # Komponen form tamu + webcam
│   │   └── AdminPanel.jsx       # Komponen admin dashboard
│   └── lib/
│       └── firebase.js          # Konfigurasi Firebase
├── public/
│   └── images/
│       └── logo_kpu.png         # Logo KPU
├── .env.example                 # Template environment variables
├── .env.local                   # Environment variables (jangan commit!)
├── .gitignore
├── next.config.mjs
├── tailwind.config.js
├── package.json
└── README.md
```

## 🔒 Keamanan

- ✅ Password admin disimpan di environment variable
- ✅ Input validation dan sanitization
- ✅ Kata kunci harian untuk akses form
- ✅ Session-based admin authentication
- ✅ Firebase Security Rules (harus disetup manual)

### Recommended Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Guests collection - read/write with validation
    match /guests/{document=**} {
      allow read: if true;
      allow create: if request.auth != null || true; // Sesuaikan dengan kebutuhan
      allow update, delete: if request.auth != null;
    }

    // Keywords collection - read only
    match /keywords/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🚢 Deployment

### Deploy ke Vercel (Recommended)

1. Push code ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Tambahkan Environment Variables di Vercel Dashboard
4. Deploy!

```bash
npm run build
npm run start
```

### Deploy ke Platform Lain

Aplikasi ini compatible dengan platform hosting Next.js lainnya seperti:
- Netlify
- Railway
- AWS Amplify
- Google Cloud Platform

## 🐛 Troubleshooting

### Kamera tidak muncul
- Pastikan browser memiliki permission untuk akses kamera
- Gunakan HTTPS atau localhost (kamera tidak akan jalan di HTTP)

### Error Firebase
- Periksa kembali konfigurasi di `.env.local`
- Pastikan Firestore Database sudah enabled
- Periksa Firebase Security Rules

### Data tidak muncul di Admin
- Pastikan ada data di collection `guests`
- Buka browser console untuk cek error
- Periksa koneksi internet

## 📝 TODO / Future Improvements

- [ ] Migrate foto dari base64 ke Firebase Storage
- [ ] Add email notifications untuk admin
- [ ] Add QR Code untuk akses cepat
- [ ] Add rate limiting untuk mencegah spam
- [ ] Add backup/restore functionality
- [ ] Add audit log untuk tracking admin actions
- [ ] Improve accessibility (WCAG compliance)
- [ ] Add PWA support untuk offline access
- [ ] Add multi-language support
- [ ] Add dark mode

## 🤝 Contributing

Contributions, issues, dan feature requests sangat diterima!

## 📄 License

Copyright © 2025 KPU Kabupaten Tasikmalaya

## 👨‍💻 Developer

Developed for KPU Kabupaten Tasikmalaya

---

**Built with ❤️ using Next.js and Firebase**
