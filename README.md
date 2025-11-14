# 排碳大戶觀測站 (Carbon Watch)

排碳大戶觀測站是一個以資料驅動的 ESG 資訊平台，用於監測和視覺化企業的碳排放數據。

## 專案結構

除了標準的 Nuxt 目錄結構外，本專案還包含以下自定義目錄：

- `design-docs/` - 設計文件和技術規劃文件
- `raw-data/` - 從 Google Sheets 下載的原始 CSV 資料檔案
- `tools/` - 資料處理和工具腳本

## 環境需求

- Node.js 22+ (請參考 `.nvmrc`)
- npm 10+

## 安裝

確保使用正確的 Node.js 版本：

```bash
nvm use
```

安裝相依套件：

```bash
npm install
```

## 資料設定

本專案使用 Google Sheets 作為資料來源。在開始開發前，需要設定資料存取：

### 1. 設定環境變數

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，填入您的 Google Sheets API 金鑰：

```env
GOOGLE_SHEETS_API_KEY=your_api_key_here
GOOGLE_SHEETS_ID=1vRFQ6RbeBXDgp-IgWh5ue2W0SBJqAIWR9QML0AmceoR6nO_5Q83QGsalaCDqAAyOX_pIK2hOQZ-wdwb
```

如何取得 API 金鑰：
1. 前往 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 建立 API 金鑰
3. 啟用 Google Sheets API

### 2. 下載原始資料

執行以下指令從 Google Sheets 下載原始資料到 `raw-data/` 目錄：

```bash
npm run download-data
```

此腳本會：
- 從設定的 Google Sheets 讀取所有分頁
- 將每個分頁儲存為 CSV 檔案（檔名為分頁名稱）
- 使用 UTF-8 編碼，支援中文檔名和內容
- 記錄下載成功與失敗的詳細日誌

更多資訊請參考 `design-docs/data source road map.md`。

## 開發

啟動開發伺服器於 `http://localhost:3000`：

```bash
npm run dev
```

## 建置

建置正式環境版本：

```bash
npm run build
```

預覽正式環境建置結果：

```bash
npm run preview
```

## 參考資料

- [Nuxt 文件](https://nuxt.com/docs)
- [Nuxt Content 文件](https://content.nuxt.com)
- 專案設計文件請參考 `design-docs/` 目錄

