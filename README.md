# LR Master Ledger & Inventory Studio
> **High-Performance GovTech Land Record Inventory, Inheritance Matcher & Historical Forensic Genealogy Engine (Bangladesh Land Records)**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-amber.svg)](https://opensource.org/licenses/Apache-2.0)
[![Download Android APK](https://img.shields.io/badge/Download%20Android%20APK-LR__Master__Ledger__v2.0.apk-10b981?style=for-the-badge&logo=android)](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest/download/LR_Master_Ledger_v2.0.apk)
[![GitHub Releases](https://img.shields.io/badge/GitHub%20Releases-v2.0.0-fbbf24?style=for-the-badge&logo=github)](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest)

---

## 📲 Quick Android APK Download (For Mobile Users)
- **📦 Direct `.APK` File Download**: [**Click Here to Download `LR_Master_Ledger_v2.0.apk`**](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest/download/LR_Master_Ledger_v2.0.apk)
- **📂 GitHub Releases Page**: [https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest](https://github.com/tapos-cpl/lr-master-ledger-studio/releases/latest)
- **⚙️ Centralized Release Configuration**: Managed in [`src/config/repository.ts`](src/config/repository.ts) with live GitHub Release API (`releases/latest`) verification inside the in-app **APK Download Hub** (`ApkDownloadModal.tsx`) and automated Capacitor Android APK builds in [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml).

---

## 📖 Table of Contents
1. [Purpose of LR Master Ledger & Inventory Studio](#1-purpose-of-lr-master-ledger--inventory-studio)
2. [Folder & File Ingestion Workflow for Land Records](#2-folder--file-ingestion-workflow-for-land-records)
3. [How to Trigger & Customize the PDF Export](#3-how-to-trigger--customize-the-pdf-export)
4. [Inheritance (Warish) Matcher & Historical Forensic Audit Engine](#4-inheritance-warish-matcher--historical-forensic-audit-engine)
5. [Dynamic Schema & Excel / CSV / JSON Export](#5-dynamic-schema--excel--csv--json-export)
6. [Project Architecture & Directory Structure](#6-project-architecture--directory-structure)
7. [Local Development Setup](#7-local-development-setup)
8. [Developer Contribution Guide](#8-developer-contribution-guide)
9. [License](#9-license)

---

## 1. Purpose of LR Master Ledger & Inventory Studio

**LR Master Ledger & Inventory Studio** is a specialized GovTech web and Android application built as the official companion to **LR Mass Downloader** for organizing, indexing, auditing, and exporting **Bangladesh Land Records** (CS, CR, SA, RS, BS/BRS, and City surveys).

When land surveyors, legal practitioners, land revenue officers, or property-owning families download or digitize hundreds of land record documents (Khatians, Dags/Plots, Mouza maps, deeds, mutations, and Warish certificates) across deeply nested folders or `.zip` archives on a phone or computer, manually compiling them into official registries is slow and prone to human error.

**LR Master Ledger & Inventory Studio** solves this problem through four core capabilities:

1. **100% Client-Side Folder, Subfolder & ZIP Ingestion (Zero-Drop Guarantee)**:
   - Recursively reads entire folder hierarchies, multi-file selections, spreadsheets, PDFs, images, and `.zip` archives directly in the browser or Android WebView with **zero external server uploads** (preserving complete legal and personal data privacy).
   - Ensures **zero missing records**: every valid file inside any subfolder is parsed and normalized into the Master Ledger with full administrative hierarchy fields:
     - **District (জেলা)** $\rightarrow$ **Upazila/Thana (উপজেলা/থানা)** $\rightarrow$ **Mouza (মৌজা)** $\rightarrow$ **J.L. No. (জে.এল. নং)** $\rightarrow$ **Survey Type (জরিপের ধরণ: CS, SA, RS, BRS, BS)** $\rightarrow$ **Khatian No. (খতিয়ান নং)** $\rightarrow$ **Dag/Plot No. (দাগ নং)** $\rightarrow$ **Owner Details (মালিক/স্বত্ত্বাধিকারীর বিবরণ)** $\rightarrow$ **Share (হিস্যা/অংশ)** $\rightarrow$ **Land Class (জমির শ্রেণি)** $\rightarrow$ **Area (দাগের পরিমাণ)**.
2. **Mouza-Best A4 Landscape PDF Engine**:
   - Generates official Bangladesh Land Record registry tables (`বাংলাদেশ ফরম নং ৫৪৬২ (সংশোধিত)`) separated **Mouza-by-Mouza**, available both as **instant 1-click `.pdf` binary downloads** and interactive print previews with Bengali Unicode conjunct rendering (যুক্তাক্ষর), survey/class breakdowns, subtotals, and official verification signature blocks.
3. **Inheritance Certificate (Warish) Cross-Matching**:
   - Matches created land record lists against verified Warish Certificates (including 6 pre-loaded Warish Certificates covering 49 heirs in Mouza Goali, J.L. No. 84, Kaitala Dakshin Union, Nabinagar, Brahmanbaria) to produce a dedicated, downloadable Warish-Matched Land Record list.
4. **Historical Land Record Forensic Matching & Genealogy Integration Engine**:
   - Performs evidence-based forensic reconciliation across `CS → CR → SA → RS → BS/BRS → Current Record`, linking extracted persons to the Master Genealogy Ledger (`রসন আলী → আলী নেওয়াজ / নাজির আলী নেওয়াজ → সফর আলী → কামদার আলী এবং সিরাজ আলী → পরবর্তী প্রজন্ম`), validating geographic identity first, auditing missing names across survey transitions, reconciling land area gaps, and generating 10 traceable forensic reports (`REPORT 1` – `REPORT 10`).

---

## 2. Folder & File Ingestion Workflow for Land Records

The application provides flexible ingestion paths so users can upload land records from **Android/iOS mobile memory** as well as **Windows/macOS/Linux desktop folders**.

### Step-by-Step Workflow A: Direct 1-Tap Upload from the Home Screen
At the top of the main dashboard is the **ফোন মেমোরি ও সাব-ফোল্ডার ডিরেক্ট আপলোড (Phone & Folder Upload)** bar:
1. **ফোল্ডার ও সাব-ফোল্ডার নির্বাচন (Select Folder & Subfolders)**:
   - Tap or click this button to pick an entire root directory (for example, `Master_LR_Records`).
   - The parser (`src/utils/archiveParser.ts`) recursively walks all nested subfolders (`District → Upazila → Mouza → Survey`) and extracts every land record file inside.
2. **ফোন মেমোরি ফাইল / ZIP নির্বাচন (Select Phone Memory Files / ZIP)**:
   - Designed for Android/iOS mobile file pickers where folder selection may be restricted by the operating system.
   - Select multiple individual files at once (`.pdf`, `.jpg`, `.png`, `.xlsx`, `.xls`, `.csv`, `.json`, `.html`, `.txt`) or a `.zip` archive directly from your device's internal storage or `Download` directory.

### Step-by-Step Workflow B: Advanced Ingestion Modal (`আর্কাইভ আপলোড`)
Click **আর্কাইভ আপলোড** in the top navigation header (or **অ্যাডভান্সড অপশন** on the Home Upload Bar) to open the multi-mode Ingestion Modal:
1. **Tab 1 — মাস্টার ফোল্ডার ও সাব-ফোল্ডার (Master Folder & Subfolders)**:
   - Click **ফোল্ডার ও সাব-ফোল্ডার ব্রাউজ করুন** (`webkitdirectory`) or **ডিরেক্টরি পিকার (সাব-ফোল্ডার স্ক্যানার)** (powered by the browser's `window.showDirectoryPicker` File System Access API) to scan deeply nested directory trees.
   - You can also **Drag and Drop** an entire folder structure directly onto the dropzone.
2. **Tab 2 — ফোন মেমোরি মাল্টি-ফাইল (Phone Memory Multi-File)**:
   - Select any combination of spreadsheets, PDFs, images, or text lists in a single batch.
3. **Tab 3 — মাস্টার ZIP আর্কাইভ (Master ZIP Archive)**:
   - Powered by `JSZip`. Select any `.zip` file (including archives that contain nested `.zip` bundles inside subfolders) to decompress and index all records in memory.
4. **Replace vs. Append Toggle**:
   - Keep **"পূর্বের নমুনা ডাটা সরিয়ে শুধুমাত্র আমার আপলোডকৃত ফোল্ডারের সকল রেকর্ড টেবিলে ও PDF-এ রাখুন"** checked to replace sample records with your uploaded data, or uncheck it to append new uploads to your existing ledger.
5. **1-Click Sample Archive Testing**:
   - Click **১-ক্লিকে নমুনা ইনজেস্ট** to test the ingestion pipeline with a realistic multi-subfolder dataset for Cumilla and Brahmanbaria, or click **নমুনা ZIP ডাউনলোড** to download and inspect a reference `.zip` archive.

### Step-by-Step Workflow C: Forensic Document & OCR Upload (`ফরেনসিক ম্যাচিং ও রেকর্ড অডিট`)
Inside the **ফরেনসিক ম্যাচিং ও রেকর্ড অডিট** workspace:
1. Under **STEP 1 & STEP 2**, select the document type (Category A: `CS/CR/SA/RS/BS Khatian`, `Mouza Map`; Category B: `Warish Certificate`, `Registered Deed`, `Mutation/Namjari`, `Court Document`; Category C: `Handwritten Slip / OCR Note`).
2. Upload files (`.txt`, `.csv`, `.json`, `.xlsx`, `.pdf`) or paste OCR text (preserving `[অস্পষ্ট]` and `[পাঠোদ্ধার সম্ভব হয়নি]` markers for illegible passages).
3. Each uploaded file is automatically hashed with **SHA-256** to prevent duplicate ingestion and assigned a traceable **Evidence ID** (`CS-001`, `SA-001`, `RS-001`, `BS-001`, `WAR-001`, `DEED-001`, `MUT-001`, `COURT-001`, `SLIP-001`).

### Supported Folder Hierarchy & File Extensions
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
- **Supported File Formats**: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.xlsx`, `.xls`, `.csv`, `.json`, `.html`, `.htm`, `.txt`, and `.zip`.

---

## 3. How to Trigger & Customize the PDF Export

The application provides two complementary PDF export mechanisms: a **Direct Client-Side Multi-Page A4 Landscape `.pdf` File Generator** (`src/utils/pdfDownloadEngine.ts`) and an **Interactive A4 Landscape Print Studio** (`src/components/PrintReportView.tsx`).

### A. Direct 1-Click `.pdf` File Downloads (No Print Dialog Required)
1. **Warish-Matched Land Record PDF**:
   - On the Home Screen (inside the *সংযুক্ত ওয়ারিশ সনদের তালিকা ও খতিয়ান ম্যাচকৃত নতুন তালিকা* banner) or inside the **ওয়ারিশ সনদ ম্যাচিং** tab, click **ম্যাচকৃত নতুন তালিকা PDF ডাউনলোড (.pdf)** to immediately generate and download a multi-page A4 Landscape `.pdf` file containing all matched records and Warish metadata.
2. **Mouza-Wise Master Ledger PDF**:
   - Open the **উপজেলা ও মৌজাভিত্তিক A4 PDF রিপোর্ট** view and click **সরাসরি PDF ফাইল ডাউনলোড (.pdf)** to download the Mouza-by-Mouza tables directly as a `.pdf` file.
3. **Forensic Audit Reports (`REPORT 1` – `REPORT 10`) PDF**:
   - Open the **ফরেনসিক ম্যাচিং ও রেকর্ড অডিট** view, select any of the 10 forensic report tabs, and click **PDF ডাউনলোড (.pdf)** to download that specific forensic table with all `Evidence ID` references intact.

### B. Interactive Mouza-Best A4 Print & PDF Studio
1. **From the Home Screen — Mouza-Best PDF Hub (`মৌজাভিত্তিক মাস্টার PDF হাব`)**:
   - Select an Upazila from the **উপজেলা** dropdown and a Mouza (or *সকল মৌজা — পৃথক টেবিলে*) from the **মৌজা নির্বাচন** dropdown, then click **মৌজাভিত্তিক মাস্টার PDF ডাউনলোড**.
   - Or click the **PDF** button on any individual **Mouza Quick-Card** to open the print studio filtered to that specific Mouza.
2. **From the Top Navigation Bar**:
   - Click the gold **মৌজাভিত্তিক PDF ডাউনলোড** dropdown button in the top-right header to select all Upazilas or a specific Upazila, or click the **উপজেলা ও মৌজাভিত্তিক A4 PDF রিপোর্ট** tab.
3. **From Selected Rows in the Inventory Grid**:
   - Check the boxes next to specific Khatians or Dags in the ledger table and click **নির্বাচিত প্রিন্ট (A4)** in the floating batch action bar.
4. **Customizing & Printing inside the Print Studio**:
   - **মৌজা সূচিপত্র (Mouza Summary Index)**: Toggle the master summary index table (`মৌজাভিত্তিক সারসংক্ষেপ সূচিপত্র`) at the top of multi-Mouza reports.
   - **প্রতি মৌজা আলাদা পৃষ্ঠায় (Page Break per Mouza)**: Keep enabled so each Mouza table begins on a fresh A4 Landscape sheet.
   - **মৌজাভিত্তিক মাস্টার PDF প্রিন্ট / Save**: Opens the native print dialog (set **Destination: Save as PDF**, **Layout: Landscape**, **Paper Size: A4**, and enable **Background graphics**).
   - **ডাউনলোড রিপোর্ট ফাইল (`.html`)**: Exports a standalone, self-contained HTML report file with embedded Bengali font links for offline archiving and printing.

---

## 4. Inheritance (Warish) Matcher & Historical Forensic Audit Engine

### A. Inheritance Certificate (Warish) Matcher (`ওয়ারিশ সনদ ম্যাচিং`)
- Matches land records against the 6 verified Warish Certificates (49 heirs across deceased ancestors ফিরুজ মিয়া, সফর আলী, সিরাজ আলী, মোঃ জাহের মিয়া, আব্দুল কাদির, and নোয়াব মিয়া in Mouza Goali, Nabinagar, Brahmanbaria).
- Provides 1-click actions to filter by strict Mouza Goali matches or all lineage matches, apply the enriched records directly to the Master Ledger, or download the matched list as a `.pdf` or `.xlsx` file.

### B. Forensic Matching & Genealogy Integration Engine (`ফরেনসিক ম্যাচিং ও রেকর্ড অডিট`)
- **Stage-1 Geographical Validation**: Validates `District → Upazila → Mouza → J.L. No. → Survey Type → Khatian → Dag` before running person matching. A person-name match never overrides a geographical mismatch (`GEOGRAPHIC MISMATCH`).
- **13-Criteria Person & Genealogy Matching**: Evaluates verbatim and normalized Bengali names, spelling variants (`আলী নেওয়াজ` vs. `নাজির আলী নেওয়াজ`), father/spouse names, generation depth, and Khatian/Dag continuity across 9 match classifications.
- **Land Area & Share Reconciliation**: Calculates `Unexplained Area = Parent Dag Area − Sum of Identified Successor Areas` (`AREA RECONCILED`, `AREA GAP — X শতক UNRECONCILED`, or `OVER-ALLOCATION / AREA CONFLICT`), preserving competing historical claims side-by-side (including the 33 Shatak vs. 30 Shatak SA Dag claim against 28 Shatak identified BS records).
- **10 Standardized Output Reports (`REPORT 1` – `REPORT 10`) & Automated Test Suite (`TEST A` – `TEST J`)**: Includes full traceability, non-destructive Master Ledger update proposals with 1-click Rollback Version History, and 10 self-verifying forensic test cases.

---

## 5. Dynamic Schema & Excel / CSV / JSON Export

- **Dynamic Column Customizer (`কলাম কনফিগ`)**:
  - Automatically detects extra attributes (`তৌজি নং`, `সাবেক দাগ`, `হাল দাগ`, `বাটা দাগ`, `খাজনা`, Warish fields) and lets users toggle visibility, rename headers in Bengali/English, reorder columns, or create calculated formula columns (such as converting Acre to **কাঠা [Katha]** or **বিঘা [Bigha]**).
- **Multi-Format Exports**:
  - Export the Master Ledger or any Forensic Report to **Excel (`.xlsx`)**, **UTF-8 BOM CSV (`.csv`)**, **JSON (`.json`)**, or **A4 Landscape PDF (`.pdf`)** with all Evidence IDs preserved.

---

## 6. Project Architecture & Directory Structure

```text
├── index.html                           # HTML5 entry with Bengali Unicode Google Fonts
├── metadata.json                        # Application metadata & capabilities
├── package.json                         # Dependencies & build scripts
├── vite.config.ts                       # Vite + Tailwind CSS v4 configuration
├── tsconfig.json                        # Strict TypeScript compiler configuration
├── README.md                            # Project documentation & contributor guide
└── src/
    ├── main.tsx                         # React DOM root
    ├── index.css                        # Tailwind CSS + A4 Landscape @media print rules
    ├── App.tsx                          # Root state orchestrator, Home Upload Bar & view router
    ├── config/
    │   └── repository.ts                # Centralized GitHub Releases & APK download metadata
    ├── types/
    │   ├── landRecord.ts                # Extended Master Ledger, DynamicColumn & Archive types
    │   └── forensic.ts                  # Forensic Evidence, Genealogy, Audit & Test Suite types
    ├── utils/
    │   ├── bengaliNumerals.ts           # Bengali numeral conversion & land area unit math
    │   ├── archiveParser.ts             # Recursive subfolder, multi-file, Excel/CSV/JSON & ZIP parser
    │   ├── inheritanceData.ts           # 6 Warish Certificates (49 heirs) dataset & matching engine
    │   ├── forensicEngine.ts            # Stage-1 geo validation, genealogy matcher, transition & area audit
    │   ├── pdfDownloadEngine.ts         # Direct client-side multi-page A4 Landscape .pdf binary generator
    │   ├── exportUtils.ts               # Excel (.xlsx) & UTF-8 BOM CSV exporters
    │   └── mockData.ts                  # Initial Cumilla & Brahmanbaria land record dataset
    └── components/
        ├── Header.tsx                   # Top navigation bar with workspace switcher & quick exports
        ├── InventoryGrid.tsx            # Searchable, filterable dynamic schema table with batch actions
        ├── HierarchyExplorer.tsx        # Collapsible District -> Upazila -> Mouza tree explorer
        ├── PrintReportView.tsx          # Interactive Mouza-Best A4 Landscape PDF & Summary Index studio
        ├── InheritanceMatcherView.tsx   # Warish Certificate matcher & matched-list PDF generator
        ├── ForensicAuditView.tsx        # 11-step Forensic Matching, 10 Reports, Genealogy & Test A-J UI
        ├── IngestionModal.tsx           # Multi-mode Folder, Phone Memory & ZIP uploader modal
        ├── ColumnCustomizerModal.tsx    # Dynamic column visibility, order & formula customizer
        ├── RecordDetailModal.tsx        # Individual land record editor & inspector modal
        ├── ArchiveTreeView.tsx          # Visual directory tree & file-to-record mapping inspector
        └── ApkDownloadModal.tsx         # Live GitHub Release APK downloader & mobile build guide
```

---

## 7. Local Development Setup

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9+

### Installation & Running Locally
```bash
# 1. Clone the repository
git clone https://github.com/tapos-cpl/lr-master-ledger-studio.git
cd lr-master-ledger-studio

# 2. Install dependencies
npm install

# 3. Start the Vite development server on http://localhost:3000
npm run dev

# 4. Run TypeScript type-checking / linting
npm run lint

# 5. Build for production
npm run build
```

---

## 8. Developer Contribution Guide

We welcome contributions from software engineers, Bangladesh land survey specialists, legal researchers, and GovTech contributors! Follow the guidelines below to contribute cleanly and safely.

### A. Step-by-Step Pull Request Workflow
1. **Fork & Clone the Repository**:
   Click **Fork** on [GitHub](https://github.com/tapos-cpl/lr-master-ledger-studio) and clone your fork locally.
2. **Create a Focused Feature or Fix Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or for bug fixes:
   git checkout -b fix/issue-description
   ```
3. **Verify Type-Checking, Build & Forensic Self-Tests**:
   Ensure that TypeScript linting and the production build complete with zero errors, and verify that all 10 forensic verification tests (`TEST A` – `TEST J`) pass in the **ফরেনসিক ম্যাচিং ও রেকর্ড অডিট** view:
   ```bash
   npm run lint
   npm run build
   ```
4. **Use Conventional Commits**:
   Format commit messages clearly using standard prefixes (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`):
   ```bash
   git add .
   git commit -m "feat(parser): support nested BRS khatian naming conventions"
   ```
5. **Push & Open a Pull Request**:
   ```bash
   git push origin feat/your-feature-name
   ```
   Open a Pull Request against the `main` branch describing the motivation, tested file formats, and screenshots of any UI or PDF layout updates.

### B. Core Engineering & Domain Invariants
- **Zero-Drop Ingestion Invariant**: When updating `src/utils/archiveParser.ts`, never silently discard user-uploaded files. Only skip OS system metadata files (`.DS_Store`, `Thumbs.db`, `desktop.ini`, `__MACOSX`).
- **Stage-1 Geographical Priority**: In `src/utils/forensicEngine.ts`, geographical validation (`District → Upazila → Mouza → J.L. No.`) must always run before person matching. Never allow a person-name match to override a Mouza or J.L. mismatch.
- **Non-Destructive Ledger Updates & Rollback Safety**: Never overwrite verified Master Ledger records automatically. All forensic modifications must be proposed via `MasterLedgerUpdateProposal` and store a full rollback snapshot (`LedgerAuditVersionEntry`) prior to applying changes.
- **Forensic Neutrality & Verbatim Preservation**:
  - Always store the original Bengali name verbatim alongside its normalized counterpart.
  - Preserve illegible OCR text with `[অস্পষ্ট]` or `[পাঠোদ্ধার সম্ভব হয়নি]` rather than guessing characters.
  - Label unverified court plaint claims strictly as `"PLAINTIFF'S ALLEGATION — REQUIRES INDEPENDENT DOCUMENTARY VERIFICATION."`
- **Mobile & Sandbox Iframe Compatibility**:
  - Use native `<label>` wrappers and DOM callback refs for `webkitdirectory` inputs rather than programmatic `.click()` calls on hidden inputs.
  - Avoid `window.alert`, `window.confirm`, and `window.open`; use in-app modals and direct blob downloads instead.
- **Bengali Typography & Tabular Numerals**:
  - Use `.font-bengali` (`Hind Siliguri`) for Bengali prose/headers and `.font-mono-num` (`JetBrains Mono`) with `src/utils/bengaliNumerals.ts` helpers for all Khatian numbers, Dag numbers, shares, and area calculations.

---

## 9. License

Licensed under the **Apache License, Version 2.0**. See [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0) for full license terms.
