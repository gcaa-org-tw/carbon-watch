# 排碳大戶觀測站 page & section hierarchy

1. landing page
   - URL: `/`
   - sections
     - key stats (4 numbers)
     - 十大碳排企業地圖
     - 各縣市碳排佔比地圖
     - 碳排產業分佈圖
     - 檢測標準說明 (*1)
     - 十大碳排大戶大表 (*2)
2. 企業觀測清單
   - URL:
     - `/companies` for 易讀版
     - `/companies/pro` for 專業版
     - `/companies/{slug}` for 企業詳細頁
     - query parameters:
       - `?industry=` 行業篩選
       - `&region=` 縣市篩選

   - 易讀版 & 專業版 sections
     - 篩選器 (行業 & 縣市)
     - 企業列表 (依碳排量排序)
   - 企業詳細頁 sections
     - 年碳排量、碳費
     - 雷達圖
     - 某些指標
     - 具體減量策略
     - 歷年燃煤使用量
     - 淨零路徑模擬器
3. 基金觀測
   - URL:
     - `/funds` for 首頁
      - `/funds/{slug}` for 基金詳細頁
   - 首頁 sections
     - 基金列表
   - 基金詳細頁 sections
     - 投資標的企業列表
4. 綠盟的氣候績效指標
   - URL: `/methodology`
