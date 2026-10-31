# LR Master Ledger & Inventory Studio
> **High-Performance GovTech Companion Application for LR Mass Downloader (Bangladesh Land Records)**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-amber.svg)](https://opensource.org/licenses/Apache-2.0)
[![Download Android APK](https://img.shields.io/badge/Download%20Android%20APK-LR__Master__Ledger__v2.0.apk-10b981?style=for-the-badge&logo=android)](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest/download/LR_Master_Ledger_v2.0.apk)
[![GitHub Releases](https://img.shields.io/badge/GitHub%20Releases-v2.0.0-fbbf24?style=for-the-badge&logo=github)](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest)

---

## 📲 Quick Android APK Download (For Mobile Users)
- **📦 Direct `.APK` File Download**: [**Click Here to Download `LR_Master_Ledger_v2.0.apk`**](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest/download/LR_Master_Ledger_v2.0.apk)
- **📂 GitHub Releases Page**: [https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest)
- **⚙️ Automated GitHub Actions APK Builder**: Included in [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) — every push to `main` automatically compiles the Android `.apk` via Capacitor + Gradle and attaches `LR_Master_Ledger_v2.0.apk` to GitHub Releases.

---

## 📖 Table of Contents
1. [Purpose & Project Overview](#1-purpose--project-overview)
2. [How to Use the Folder & File Ingestion Feature](#2-how-to-use-the-folder--file-ingestion-feature)
3. [How to Trigger & Customize the PDF Export (Mouza-Best PDF Engine)](#3-how-to-trigger--customize-the-pdf-export-mouza-best-pdf-engine)
4. [Dynamic Schema & Excel / CSV Export](#4-dynamic-schema--excel--csv-export)
5. [Project Architecture & Tech Stack](#5-project-architecture--tech-stack)
6. [Local Development Setup](#6-local-development-setup)
7. [Android APK & Mobile Companion](#7-android-apk--mobile-companion)
8. [How Developers Can Contribute](#8-how-developers-can-contribute)
9. [License](#9-license)

---

## 1. Purpose & Project Overview

**LR Master Ledger & Inventory Studio** is a specialized GovTech web and mobile application designed as the official companion to **LR Mass Downloader**. When land surveyors, legal practitioners, land revenue officers, or property owners mass-download hundreds of Bangladesh Land Record files (Khatians, Dags, Mouza maps, and registries across CS, SA, RS, BRS/BS, and City surveys), those files are typically stored in deeply nested folders or `.zip` archives on a phone or computer.

Manually inspecting and compiling these downloaded files into official registries is slow and error-prone. **LR Master Ledger & Inventory Studio** solves this by:

- **Ingesting Entire Folder Hierarchies & ZIP Archives In-Browser**: Reads nested folders, subfolders, and `.zip` files directly from phone memory or desktop storage with **100% client-side execution** (zero server uploads, preserving complete data privacy).
- **Zero-Drop Record Indexing**: Guarantees that **not a single uploaded file or record is missed**. Every PDF, image, Excel sheet, CSV, JSON manifest, or text record inside any subfolder is parsed and normalized into a structured master ledger.
- **Automated Administrative Hierarchy Extraction**: Parses District (জেলা), Upazila/Thana (উপজেলা/থানা), Mouza (মৌজা), J.L. No. (জে.এল. নং), Survey Type (জরিপের ধরণ: CS, SA, RS, BRS, BS), Khatian No. (খতিয়ান নং), Dag/Plot No. (দাগ নং), Owner Details (মালিক/স্বত্ত্বাধিকারীর বিবরণ), Share (হিস্যা/অংশ), Land Classification (জমির শ্রেণি), and Area (দাগের পরিমাণ).
- **Mouza-Best Printable PDF Ledgers**: Generates official **A4 Landscape** Bangladesh Land Record registry tables (`বাংলাদেশ ফরম নং ৫৪৬২ (সংশোধিত)`) separated **Mouza-by-Mouza**, with flawless Bengali Unicode conjunct rendering (যুক্তাক্ষর), survey/class breakdowns, subtotals, and official signature blocks.

---

## 2. How to Use the Folder & File Ingestion Feature

The application provides multiple ingestion workflows so you can upload records smoothly from **Android/iOS phone memory** as well as **Windows/macOS/Linux desktops**.

### A. Quick Upload from the Home Screen (1-Tap Mobile & Desktop Bar)
Located at the top of the main dashboard is the **ফোন মেমোরি ও সাব-ফোল্ডার ডিরেক্ট আপলোড (Phone & Folder Upload)** bar:
1. **ফোল্ডার ও সাব-ফোল্ডার নির্বাচন (Select Folder & Subfolders)**:
   - Tap or click this button to select an entire parent folder (e.g., `Master_LR_Records` or any downloaded folder on your device).
   - The app recursively scans all nested subfolders (District $\rightarrow$ Upazila $\rightarrow$ Mouza $\rightarrow$ Survey) and extracts every file inside.
2. **ফোন মেমোরি ফাইল / ZIP নির্বাচন (Select Phone Memory Files / ZIP)**:
   - Designed specifically for Android and iOS mobile file managers that restrict directory selection.
   - Tap to select multiple files at once (`.pdf`, `.jpg`, `.png`, `.xlsx`, `.xls`, `.csv`, `.json`, `.html`, `.txt`) or a `.zip` archive directly from your phone's `Download` or internal storage folder.

### B. Advanced Ingestion Engine Modal (`আর্কাইভ আপলোড`)
Click **আর্কাইভ আপলোড** in the top navigation bar (or **অ্যাডভান্সড অপশন** on the Home Upload Bar) to open the full Ingestion Modal:
1. **Tab 1 — মাস্টার ফোল্ডার ও সাব-ফোল্ডার (Master Folder & Subfolders)**:
   - Use **ফোল্ডার ও সাব-ফোল্ডার ব্রাউজ করুন** (`webkitdirectory`) or **ডিরেক্টরি পিকার (সাব-ফোল্ডার স্ক্যানার)** (powered by the browser's `window.showDirectoryPicker` File System Access API) to recursively walk deeply nested directory trees.
   - Also supports **Drag-and-Drop**: drag any folder with subfolders directly onto the dropzone.
2. **Tab 2 — ফোন মেমোরি মাল্টি-ফাইল (Phone Memory Multi-File)**:
   - Select any combination of individual land record files or spreadsheets from mobile storage without MIME-type restrictions.
3. **Tab 3 — মাস্টার ZIP আর্কাইভ (Master ZIP Archive)**:
   - Powered by `JSZip`. Select any `.zip` file (even archives containing nested `.zip` files inside subfolders) to decompress and index all records in memory.

### C. Replace vs. Append Mode & Sample Testing
- **Replace Sample Data Toggle**: Inside the Ingestion Modal, the checkbox **"পূর্বের নমুনা ডাটা সরিয়ে শুধুমাত্র আমার আপলোডকৃত ফোল্ডারের সকল রেকর্ড টেবিলে ও PDF-এ রাখুন"** is enabled by default so your ledger and PDF exports contain **only** your uploaded records. Uncheck it if you wish to merge/append multiple uploads together.
- **1-Click Sample Archive**: Don't have an archive handy? Click **১-ক্লিকে নমুনা ইনজেস্ট** to generate and ingest a realistic multi-subfolder archive for Cumilla and Brahmanbaria, or click **নমুনা ZIP ডাউনলোড** to inspect a sample `.zip` structure.

### D. Supported Folder Hierarchy & File Formats
The parser automatically recognizes standard **LR Mass Downloader** paths as well as custom folder layouts:
```text
Master_LR_Records/
├── [District Name]/
│   └── [Upazila Name]/
│       ├── [SurveyType]_[MouzaName]_(JL_[JLNo])/
│       │   ├── Kh_412_Dag_1085.pdf
│       │   └── Kh_412_Dag_1086.pdf
│       └── [MouzaName]/
│           └── khatian_records.xlsx
└── master_inventory_manifest.json
```
- **Supported File Extensions**: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.xlsx`, `.xls`, `.csv`, `.json`, `.html`, `.htm`, `.txt`, and `.zip`.

---

## 3. How to Trigger & Customize the PDF Export (Mouza-Best PDF Engine)

The PDF engine is designed specifically for Bangladesh Land Record reporting, ensuring **every Mouza is rendered in its own separate table** and **zero records from your uploaded source are omitted**.

### A. 3 Ways to Trigger the PDF Report
1. **From the Home Screen — Mouza-Wise Master PDF Hub (`মৌজাভিত্তিক মাস্টার PDF হাব`)**:
   - **All Mouzas / Specific Upazila**: Choose an Upazila from the **উপজেলা** dropdown and a Mouza (or *সকল মৌজা — পৃথক টেবিলে*) from the **মৌজা নির্বাচন** dropdown, then click **মৌজাভিত্তিক মাস্টার PDF ডাউনলোড**.
   - **1-Click Single Mouza PDF Cards**: Below the hub controls, every detected Mouza is displayed as an interactive card showing its J.L. No., record count, and total acreage. Click the **PDF** button on any Mouza card to immediately open the print-ready PDF view for that specific Mouza.
2. **From the Top Navigation Bar**:
   - Click the gold **মৌজাভিত্তিক PDF ডাউনলোড** dropdown button in the top-right header to pick either **সকল উপজেলা (পৃথক মৌজা টেবিল)** or any individual Upazila in one click.
   - Or click the **উপজেলা ও মৌজাভিত্তিক A4 PDF রিপোর্ট** workspace tab in the top center bar.
3. **For Selected Rows in the Inventory Grid**:
   - Check the boxes next to specific Khatians or Dags in the ledger table and click **নির্বাচিত প্রিন্ট (A4)** in the floating batch action bar.

### B. Customizing & Saving the PDF inside the Print Workspace
Once inside the Print / PDF Report View:
1. **Filter by Upazila or Mouza on the Fly**:
   - Use the top **উপজেলা** and **মৌজা নির্বাচন** dropdowns, or click any pill in the **দ্রুত মৌজা ভিউ (Quick Mouza Bar)** to switch between a single Mouza report and a full multi-Mouza report.
2. **Toggle the Mouza Summary Index (`মৌজা সূচিপত্র`)**:
   - When printing multiple Mouzas, keep **মৌজা সূচিপত্র** checked to include a master summary table (`মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র`) at the top of the report listing every Mouza, J.L. No., Survey types, total Khatians, total Dags, and total area.
3. **Toggle Page Breaks (`প্রতি মৌজা আলাদা পৃষ্ঠায়`)**:
   - Keep **প্রতি মৌজা আলাদা পৃষ্ঠায়** checked so each Mouza table starts cleanly on a new A4 Landscape sheet.
4. **Save as A4 Landscape PDF**:
   - Click the gold **মৌজাভিত্তিক মাস্টার PDF প্রিন্ট / Save** button (or click **শুধুমাত্র এই মৌজা প্রিন্ট** on any individual Mouza header).
   - In the browser print dialog:
     - Set **Destination** to **Save as PDF**.
     - Set **Layout** to **Landscape** and **Paper Size** to **A4**.
     - Enable **Background graphics** for crisp header shading.
5. **Download Standalone Offline Report (`.html`)**:
   - Click **ডাউনলোড রিপোর্ট ফাইল** to download a self-contained, offline-printable HTML ledger file with embedded Bengali font links.

---

## 4. Dynamic Schema & Excel / CSV Export

- **Dynamic Column Customizer (`কলাম কনফিগ`)**:
  - Extra attributes discovered in uploaded files (such as `তৌজি নং`, `সাবেক দাগ`, `হাল দাগ`, `বাটা দাগ`, `খাজনা`) are automatically appended to the ledger.
  - Open **কলাম কনফিগ** to show/hide columns, rename column headers in Bengali or English, reorder columns, or add calculated formula columns (e.g., automatic conversion of Acre to **কাঠা [Katha]** or **বিঘা [Bigha]**).
- **Excel (`.xlsx`) & CSV Export**:
  - Click **এক্সেল** in the top bar (or **এই মৌজার এক্সেল** in the Print View) to export a formatted `.xlsx` workbook with auto-sized columns, or export UTF-8 BOM encoded `.csv` files that open cleanly in Microsoft Excel without garbling Bengali characters.

---

## 5. Project Architecture & Tech Stack

- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling & Print Layout**: Tailwind CSS v4 + `@media print` A4 Landscape rules (`index.css`)
- **Typography**: `Hind Siliguri` (Bengali Unicode), `Plus Jakarta Sans` (UI), `JetBrains Mono` (Tabular Numerals)
- **Archive & Spreadsheet Engines**: `jszip` (in-browser ZIP extraction) + `xlsx` / SheetJS (Excel parsing & export)
- **Icons**: `lucide-react`

```text
├── index.html                        # HTML5 entry with Bengali Unicode Google Fonts
├── metadata.json                     # App metadata configuration
├── package.json                      # Dependencies & scripts
├── vite.config.ts                    # Vite + Tailwind CSS plugin setup
├── tsconfig.json                     # TypeScript compiler configuration
├── README.md                         # Project documentation & contribution guide
└── src/
    ├── main.tsx                      # React DOM entry point
    ├── index.css                     # Tailwind CSS + A4 Landscape print media rules
    ├── App.tsx                       # Main state orchestrator, Home Upload Bar & Mouza PDF Hub
    ├── types/
    │   └── landRecord.ts             # Interfaces: LandRecord, DynamicColumn, IngestedArchiveNode
    ├── utils/
    │   ├── bengaliNumerals.ts        # Bengali numeral converters & Acre/Shotok/Katha/Bigha math
    │   ├── archiveParser.ts          # Recursive subfolder, multi-file, Excel/CSV/JSON & ZIP parser
    │   ├── exportUtils.ts            # Excel (.xlsx) & UTF-8 BOM CSV export utilities
    │   └── mockData.ts               # Sample Cumilla & Brahmanbaria land record dataset
    └── components/
        ├── Header.tsx                # Top Navigation Bar with quick Mouza PDF & APK menus
        ├── InventoryGrid.tsx         # Filterable, sortable dynamic ledger table with batch actions
        ├── HierarchyExplorer.tsx     # Collapsible District -> Upazila -> Mouza sidebar tree
        ├── PrintReportView.tsx       # Mouza-Best A4 Landscape PDF & Summary Index engine
        ├── IngestionModal.tsx        # Multi-mode Folder, Phone Memory & ZIP uploader modal
        ├── ColumnCustomizerModal.tsx # Dynamic column visibility, rename & formula builder
        ├── RecordDetailModal.tsx     # Individual record inspector & editor modal
        ├── ArchiveTreeView.tsx       # Visual directory tree & file-to-record mapping inspector
        └── ApkDownloadModal.tsx      # Android APK download & GitHub repository sync hub
```

---

## 6. Local Development Setup

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** (or **bun** / **pnpm**)

### Installation & Running Locally
```bash
# 1. Clone the repository
git clone https://github.com/tapos-cpl/lr-master-ledger-studio.git
cd lr-master-ledger-studio

# 2. Install dependencies
npm install

# 3. Start the development server on http://localhost:3000
npm run dev

# 4. Type-check and lint the codebase
npm run lint

# 5. Build for production
npm run build
```

---

## 7. Android APK & Mobile Companion

Click **GitHub ও APK** (or **APK ডাউনলোড** in the top bar) inside the app to access the mobile release manifest and GitHub sync commands:
- **Direct APK Release URL**: `https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest/download/LR_Master_Ledger_v2.0.apk`
- To build the Android APK from source using Capacitor:
  ```bash
  npm run build
  npx cap add android
  npx cap sync android
  cd android && ./gradlew assembleRelease
  ```

---

## 8. How Developers Can Contribute

We welcome contributions from developers, GovTech designers, and land survey domain experts! Follow the guidelines below to contribute to **LR Master Ledger & Inventory Studio**:

### A. Contribution Workflow
1. **Fork the Repository**:
   Click the **Fork** button on [GitHub](https://github.com/tapos-cpl/lr-master-ledger-studio) to create your own copy.
2. **Create a Feature or Fix Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or for bug fixes:
   git checkout -b fix/issue-description
   ```
3. **Make Your Changes & Verify Build**:
   Ensure all TypeScript types and print styles compile cleanly with zero warnings:
   ```bash
   npm run lint
   npm run build
   ```
4. **Commit Using Conventional Commits**:
   Use clear commit prefixes (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`):
   ```bash
   git add .
   git commit -m "feat(parser): support CS/SA/RS survey regex variations in nested folders"
   ```
5. **Push & Open a Pull Request**:
   ```bash
   git push origin feat/your-feature-name
   ```
   Open a Pull Request against the `main` branch with a clear description of the problem solved and screenshots of any UI or PDF layout changes.

### B. Engineering Standards & Domain Guidelines
- **Zero-Drop Ingestion Invariant**: When modifying `src/utils/archiveParser.ts`, never silently discard user-uploaded files. Only ignore OS metadata files (`.DS_Store`, `Thumbs.db`, `desktop.ini`, `__MACOSX`).
- **Mobile & Iframe File Input Compatibility**: Always use native `<label>` wrappers and DOM callback refs for `webkitdirectory` inputs rather than programmatic `.click()` calls on hidden inputs, ensuring compatibility across Android WebViews, iOS Safari, and sandboxed iframes.
- **Bengali Unicode & Tabular Numerals**:
  - Use the `.font-bengali` (`Hind Siliguri`) class for Bengali prose and headers so conjuncts (যুক্তাক্ষর) never break during PDF printing.
  - Use `.font-mono-num` (`JetBrains Mono`, `tabular-nums`) and helper utilities in `src/utils/bengaliNumerals.ts` (`toBengaliNumber`, `parseAcreValue`, `formatAreaBengali`) for all Khatian numbers, Dag numbers, shares, and land area calculations.
- **Print Stylesheet Discipline**: Any interactive controls added to `PrintReportView.tsx` must include the `no-print` class so the A4 Landscape output remains clean and official.

### C. High-Impact Areas for Contribution
- Adding OCR / PDF text-layer extraction for scanned Khatian PDFs.
- Adding support for regional land measurement units (e.g., *কানি [Kani]*, *গণ্ডা [Gonda]*, *কড়া [Kora]*, *ক্রান্তি [Kranti]*, *ছটাক [Chatak]*).
- Expanding automated test coverage for diverse Mouza naming conventions across all 64 districts of Bangladesh.

---

## 9. License

Licensed under the **Apache License, Version 2.0**. See the `LICENSE` file or [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0) for details.
