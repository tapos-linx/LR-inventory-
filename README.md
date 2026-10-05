# LR Master Ledger & Inventory Studio
> **GovTech Companion Application for LR Mass Downloader (Bangladesh Land Records)**

---

## 📌 Overview

**LR Master Ledger & Inventory Studio** is a high-performance web and mobile application designed to ingest mass-downloaded Land Record archives (nested Master Folders or Master `.zip` files), automatically parse and index the hierarchical land registry data into a dynamic, filterable inventory grid, and generate clean, print-ready Bengali Land Record PDF reports and Excel files.

All processing occurs **100% in-browser (client-side)**—no files or sensitive land documents are transmitted to external servers.

---

## 🚀 Key Features

### 1. Bulk Ingestion Engine (Master Folder & ZIP Uploader)
- **Folder Ingestion**: Uses HTML5 `webkitdirectory` to scan and index nested directories directly.
- **ZIP Archive Ingestion**: Uses `JSZip` to read, decompress, and index archives in memory.
- **Hierarchy Parser**: Automatically detects and extracts records conforming to:
  ```text
  Master_LR_Records/[District]/[Upazila]/[SurveyType]_[MouzaName]_(JL_[JLNo]).[ext]
  ```
  Extracts: District (জেলা), Upazila (উপজেলা), Mouza (মৌজা), J.L. No (জে.এল. নং), Survey Type (CS, SA, RS, BRS, BS, City Survey), Khatian No (খতিয়ান নং), Dag/Plot No (দাগ নং), and file metadata.

### 2. Upazila & Mouza-Separated PDF Reports (No Missing Records)
- **Zero-Drop Guarantee**: Every uploaded or parsed record in the selected scope is accounted for—no missing rows.
- **Mouza-by-Mouza Separation**: Generates distinct tables for each Mouza within an Upazila.
- **A4 Landscape Format**: Tailored for official Bangladesh Land Records registry formats.
- **Flawless Bengali Unicode Typography**: Full support for Bengali conjuncts (যুক্তাক্ষর) using Google Fonts (*Hind Siliguri*, *Noto Sans Bengali*, *JetBrains Mono*) without broken characters or glyph clipping.
- **Repeating Headers & Page Numbers**: Automatic repeating table headers (`thead`) across page breaks and official signature blocks (সার্ভেয়ার, কানুনগো, সহকারী কমিশনার (ভূমি)).
- **Subtotals & Grand Totals**: Calculates total plots, total khatians, and total acreage/shotok for each Mouza as well as the entire Upazila.

### 3. Dynamic Column Adaptability & Schema Customizer
- Automatically discovers extra attributes in uploaded files (e.g., *তৌজি নং*, *সাবেক দাগ*, *হাল দাগ*, *বাটা দাগ*, *খাজনা*) and appends them to the table.
- Toggle visibility, rename headers, and add custom calculated columns (e.g., Acre to *কাঠা* [Katha] and *বিঘা* [Bigha] conversion).

### 4. Excel (.xlsx) & CSV Export
- One-click formatted Excel export via `xlsx` (SheetJS) with column widths and Bengali text preservation.
- CSV export encoded with UTF-8 BOM (`\uFEFF`) to prevent character corruption in Microsoft Excel.

### 5. Interactive Inventory Grid & File Tree Inspector
- Collapsible administrative tree (District $\rightarrow$ Upazila $\rightarrow$ Mouza).
- Live search by Khatian, Dag, Owner name, or Remarks.
- Multi-row selection, bulk print, bulk Excel export, and bulk deletion.
- Inspection view of the raw archive file tree.

---

## 📱 Android APK Download & Installation

You can download the compiled Android APK directly from the GitHub repository release:

### 📥 Download Links:
- **Direct APK Download**: [https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest/download/LR_Master_Ledger_v1.0.apk](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest/download/LR_Master_Ledger_v1.0.apk)
- **GitHub Releases Page**: [https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest)

### 📲 Installation Instructions for Android:
1. Tap the **"APK সরাসরি ডাউনলোড"** button in the app's top bar or visit the link above.
2. Open Android **Settings** $\rightarrow$ **Security** (or **Apps & Notifications**) and enable **"Install unknown apps"** for your browser or file manager.
3. Tap on the downloaded `LR_Master_Ledger_v1.0.apk` file and tap **Install**.
4. Open the app to index land record archives offline in the field.

### 🛠️ Building the APK from Source (Capacitor / Android Studio):
```bash
# 1. Install dependencies & build Vite web app
npm install
npm run build

# 2. Add Android Capacitor platform (if not already added)
npx cap add android

# 3. Sync built web assets to Android
npx cap sync android

# 4. Open in Android Studio to build APK
npx cap open android
# Or build directly via Gradle:
cd android && ./gradlew assembleRelease
```

---

## 📂 Project Architecture

```text
├── index.html                       # HTML5 entry with Bengali Google Fonts
├── metadata.json                    # AI Studio metadata
├── package.json                     # NPM package configuration
├── vite.config.ts                   # Vite + Tailwind CSS configuration
├── tsconfig.json                    # TypeScript compiler options
├── README.md                        # Documentation & APK instructions
└── src/
    ├── main.tsx                     # React application entry point
    ├── index.css                    # Tailwind CSS + A4 Landscape print media rules
    ├── App.tsx                      # Main application orchestrator
    ├── types/
    │   └── landRecord.ts            # Type definitions for LandRecord, DynamicColumn, etc.
    ├── utils/
    │   ├── bengaliNumerals.ts       # Bengali/English numeral & area unit conversions
    │   ├── archiveParser.ts         # Dual ingestion engine (JSZip & webkitdirectory)
    │   ├── exportUtils.ts           # Excel (.xlsx) & CSV export engines
    │   └── mockData.ts              # Cumilla & Brahmanbaria authentic dataset
    └── components/
        ├── Header.tsx               # Top Bar (Zone 1, Zone 2, Zone 3)
        ├── InventoryGrid.tsx        # Dynamic schema tabular ledger with multi-select
        ├── HierarchyExplorer.tsx    # District -> Upazila -> Mouza navigation tree
        ├── PrintReportView.tsx      # A4 Landscape Upazila & Mouza PDF report engine
        ├── IngestionModal.tsx       # Bulk ZIP & Folder dropzone with sample generator
        ├── ColumnCustomizerModal.tsx# Column order, visibility, & formula customizer
        ├── RecordDetailModal.tsx    # Individual record editor & viewer
        ├── ArchiveTreeView.tsx      # File-tree inspection panel
        └── ApkDownloadModal.tsx     # Android APK download & installation dialog
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Steps:
```bash
# Clone the repository
git clone https://github.com/tapos-cpl/lr-master-ledger-studio.git
cd lr-master-ledger-studio

# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Build for production
npm run build
```

---

## 📄 License
Licensed under the Apache-2.0 License.
Developed for Bangladesh Land Registry digitisation and GovTech workflows.
