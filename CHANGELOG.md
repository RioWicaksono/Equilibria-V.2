# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Phase 3: Test Coverage Expansion

- **Validation Tests** - 40+ new tests for Settings validation (theme, language, currency, PIN)
- **Rate Limiting Tests** - Unit tests for database rate limiting
- **E2E Critical Flows** - Playwright tests for add transaction, navigation, budget management
- **Optimistic Updates** - Instant UI feedback for CRUD operations
- **Retry Logic** - Exponential backoff (3 retries, 1s-10s delay)

#### Phase 2: Frontend Optimization

- **Lazy Loading** - Heavy components (Recharts, Tesseract.js) load on demand
- **LazyComponents.tsx** - Suspense wrappers for Chart, PieChart, Calendar, ReceiptScanner
- **PieChart Component** - Category breakdown visualization
- **Error Boundaries** - Graceful degradation per-section

#### Phase 1: Stabilitas & Security Hardening

- **Database Rate Limiting** - Serverless-compatible rate limiting using PostgreSQL
- **Rate Limit Cleanup Cron** - Automatic cleanup every 5 minutes
- **Settings Validation** - Zod schema with strict mode
- **Sentry Integration** - Error tracking configuration
- **Enhanced Health Check** - DB status, memory usage, rate limit entries

#### Input Enhancement Features (100% Free)

1. **Quick Add Templates**
   - Simpan transaksi favorit sebagai template
   - Akses cepat dari modal transaksi
   - Tersimpan di localStorage
   - CRUD template tanpa batas

2. **Voice Input**
   - Input transaksi dengan suara (Web Speech API)
   - Mendukung Bahasa Indonesia
   - Parsing otomatis: nominal, deskripsi, jenis
   - Contoh: "pengeluaran 50000 makan siang"

3. **Recent Categories First**
   - Kategori yang sering digunakan muncul di atas
   - Based on usage in last 7 days
   - Indikator jam untuk kategori recent
   - Auto-sort setiap kali buka dropdown

4. **Calculator Mode**
   - Ketik ekspresi matematika langsung di field nominal
   - Contoh: "150+50-20" = 180
   - Toggle dengan klik ikon kalkulator
   - Safe evaluation (hanya angka & operator)

5. **Duplicate Transaction**
   - Duplikat transaksi dengan 1 klik
   - Otomatis isi form dengan data yang sama
   - Tanggal default: hari ini
   - Swipe kanan atau klik tombol

6. **Swipe Actions**
   - Geser kiri: Hapus transaksi
   - Geser kanan: Edit / Duplikat
   - Support touch events (mobile-first)
   - Animasi smooth dengan Framer Motion

7. **Home Screen Widget (PWA Shortcuts)**
   - 4 shortcut di manifest.json:
     - Tambah Transaksi
     - Dompet
     - Statistik
     - Budget
   - Install shortcut langsung dari homescreen

8. **QR/Receipt OCR Scanner**
   - Scan struk dengan kamera HP
   - OCR menggunakan Tesseract.js (offline capable)
   - Parsing otomatis nominal & tanggal
   - Fallback: input manual
   - Support upload file gambar

### Technical

- Added `tesseract.js` for OCR functionality
- Added TypeScript declarations for Web Speech API
- Updated `next.config.mjs` with hooks/components aliases
- Fixed webpack alias resolution for app folder imports

## [1.0.0] - 2025-06-18

### Added

- **Dashboard** - Ringkasan keuangan real-time
- **Transaksi** - Pencatatan pemasukan & pengeluaran
- **Multi-Dompet** - Kelola berbagai rekening (IDR, USD, dll)
- **Budget** - Batas pengeluaran per kategori
- **Target Tabungan** - Pantau progress pencapaian
- **Hutang & Piutang** - Kelola pinjaman
- **Auto Transaction** - Transaksi berulang otomatis
- **Reminder** - Pengingat jatuh tempo
- **PWA** - Install sebagai aplikasi native
- **Keamanan** - PIN & biometric authentication
- **Mobile-First** - Responsive design
- **Telegram Bot** - Catat transaksi via chat
- **Import/Export** - CSV & JSON format
- **API Documentation** - OpenAPI/Swagger
- **Offline Support** - Queue transaksi saat offline
- **SSE Notifications** - Real-time updates

### Technical

- Next.js 15 App Router
- React 19 with Server Components
- Prisma ORM with PostgreSQL
- Tailwind CSS 4
- Framer Motion animations
- TypeScript strict mode
- DDD architecture (Domain, Application, Infrastructure layers)
