# 首頁前十大地圖：取消 hover 變色＋廠區點位 設計紀錄

日期：2026-07-29。Joseph 核准後實作。

## 需求

1. 前十大碳排企業地圖：非 highlight 縣市滑鼠移入不再變色（原本會塗上 earth-brown-light，深色主題下呈鮭橘色）；游標同步改回一般箭頭（縣市在此區塊不可點）
2. 公司輪播維持
3. 綠色 highlight（選中公司的排放縣市）與廠區排放明細 tooltip 維持
4. 廠區以實際廠址座標在地圖上點出（比照燃煤工廠地圖的做法）

「各縣市排碳大戶排放量」區塊與 /coal-map 行為不變。

## 資料設計

- 座標 SSOT：試算表「溫室氣體排放源事業盤查登錄_104-113」（`125IPdMEUeLGzOF95ga3wsGV3jhP4J5wqbrIQt9KGjI4`）新增「廠座標」分頁，69 列＝前十大 113 年度全部廠區（含標題 70 列）。欄位：管制編號、事業名稱、縣市、wgs84經度、wgs84緯度、座標來源、備註。D:E 欄設 `0.############` 數字格式（防 FORMATTED 匯出四捨五入）
- 座標來源（沿用燃煤地圖慣例）：
  - `ems_s_01` 55 列（其中 15 列照抄燃煤地圖廠座標登錄；來源為環境部「環境保護許可管理系統（暨解除列管）對象基本資料」，https://data.gov.tw/dataset/118447 官方資源連結查詢）
  - `ems_s_01（座標為 0，沿用同址廠區座標）` 6 列——台積電同址分期廠（十八廠二～六期→一期、十四廠八期→七期），備註記主廠與管制編號
  - `OSM 街道級（ems_s_01 座標為 0，以登記地址街道定位）` 8 列（含燃煤表原有的南亞錦興廠），備註記查詢街道
- `tools/download-raw-data.ts`：自同一張 SSOT 加抓「廠座標」→ `raw-data/廠座標.csv`（best-effort，與工廠 SOT 同模式）
- `tools/transform-top-company-region-data.ts`：以管制編號 join，`FactoryEmission` 增加選填 `經度`／`緯度`；輸出中任何廠區缺座標時 logger 大聲逐廠警告（新增廠區未補座標時 CI log 可見）
- 注意：`raw-data/廠座標.csv` 必須無 BOM（本 repo 管線輸出一律無 BOM，`parseCSV` 不剝 BOM；帶 BOM 會使 join 全數失敗）

## 前端設計

- `TaiwanMap.vue` 新增 props：
  - `hoverHighlight`（預設 `true`）：`false` 時滑鼠移入不改 fill/stroke、游標 default。預設值保住縣市排放區塊的原行為
  - `markers`（`{ 經度, 緯度 }[]`，預設空）：畫在縣市之上的點位圖層，`pointer-events: none` 不攔截縣市 hover／tooltip，watch 重繪、resize 重建
- 記號：×（十字叉），臂長 4、線寬 2、圓端點，色 `--color-surface-warm`（深色）。選擇理由：
  - 亮綠 highlight 縣市（`--color-green-pure` #05D915）上深色對比 6.8:1；白色（1.9:1）、accent 紅（2.0:1）、forest（2.2:1）皆不足
  - 淡紅點另踩紅綠色弱混淆區；×靠形狀區辨，不會像實心圓被誤讀為孔洞／湖泊（Joseph 2026-07-29 指示不用深色圓點後定案）
- `TopCompanyMapSection.vue`：`factoryMarkers` computed 取選中公司廠區、過濾缺座標、同座標去重（同址分期廠一址一點，且維持 TaiwanMap 內 d3 data join 的 key 唯一）；兩個地圖實例傳 `:markers` 與 `:hover-highlight="false"`

## 驗證（2026-07-29 全過）

`npm run build`（887 routes）＋ `npm run lint` 乾淨；瀏覽器（chrome-devtools MCP）：非 highlight 縣市 hover fill 不變、游標 default、綠縣市 tooltip 正常（台積電·台南 15 廠）、台積電 25 個不重複點位含竹科／南科群聚可辨、手機 390px 重繪後點位正常、縣市排放區塊 hover 變色與 pointer 游標未變且無點位、/coal-map 80 顆泡泡正常、console 無錯誤。
