# 進度

## A 段：盤點與提案（2026-07-29 完成）

- 抓齊 greentrade 全表 11 頁 211 家（scrape_greentrade.py；網站標示最後更新 2026/07/28），無重複，SBTi 值域四種齊備
- 盤出完整資料鏈（見 CLAUDE.md），確認更新根源只有爬蟲表 raw_data 一處，repo 程式零修改
- 比對三方（今日 greentrade × 上游爬蟲表 × 站上 CSV），產出差異清單 data/comparison_result.json
- 挖到 H 欄非上市櫃 fallback 公式 bug；名稱臺／台形差異釐清
- 盤點 qyke xlsx 五分頁結構與其靜態統計漂移問題
- 提案交 Joseph，三項寫入全數核准（見 decisions.md）

## B 段：寫入與串接（2026-07-29 進行中，寫入三待 Joseph 決定）

- [x] 寫入一：爬蟲表 raw_data 覆寫 A2:E212（211 家，1055 格）；臺→台 10 家、EN→ZH 對照、V/X→TRUE/FALSE；A213:E1000 清空；notes append 一列。回讀全量比對 211 列零差異（不只抽 3 家）
- [x] 寫入二：raw_國際減碳倡議 H2:H1000 fallback 方向修正（只換 IFERROR 第二參數的 INDEX/MATCH）。和友紡織 H=35192807、金元福 H=34227006 到位；211 家中 132 家有統編、79 家兩份參照表皆無（原態）
- [x] 驗證傳播：排碳大戶表_Data O 欄 13/13 全中（site_diffs 12 家新值＋新纖變「無」），IMPORTRANGE 已自動刷新
- [x] 寫入三：最終**撤回並還原**（決策 #11）。過程：上傳前查核發現 qyke 同日 16:11 已手動改 xlsx（新增「最新20260731企業名單」分頁、舊名單改名「存檔企業名單」；統計摘要／永續獎／說明仍為舊值）→ 停下請示，Joseph 先選合併方案（決策 #9），合併版驗證後同 id 上傳（版本 117）→ Joseph 隨即指示 qyke 的部分不要動 → 以上傳前留存的原版檔還原（版本 122，md5 與 qyke 版逐 byte 一致）。現況：xlsx 完全是 qyke 16:11 的狀態，後續由他維護；合併版與 build_xlsx.py 留存待命
- [x] commit SBTi_Parsing/ 進 repo（不 push）
- [x] 更新本檔與 checkpoints，回報 Joseph
- [x] CI sync＋部署（2026-07-29，Joseph 指示手動觸發）：sync-data workflow 成功（遠端 commit 0c2f556，diff 確認 13 家新值入 raw-data 與 app/assets/data）；因 sync commit 帶 [skip ci] 不會自動部署，依 repo 前例（192ddf0）用 commit-tree 推空觸發 commit 66ff74c（未夾帶本地未 push 的 SBTi commit），deploy workflow 成功。驗證：build 輸入 company-list.json（origin/main）七家抽驗全數一致（欣銓／和友紡織／亞泥／群創＝符合1.5°C目標、超豐／遠東新＝承諾設定科學基礎目標、新纖＝打叉），且線上站（thaubing-esg.gcaa.org.tw）欣銓公司頁 chunk 已見新值。網站更新完成

Why（未來 session 不易從檔案推回的脈絡）：寫入三曾停手，依據＝「覆寫前先看目標」原則——Drive modifiedTime（16:11）晚於 A 段快照（16:02）且分頁結構不符，判定為 qyke 同日並行更新而非快照過時；請示後依決策 #9 合併，旋依決策 #11 撤回還原——xlsx 定調為 qyke 的維護範圍。Joseph 同時定調（決策 #10）：核心交付是排碳大戶觀測站資料鏈暢通，xlsx 從簡。鏈路終端驗證：I. 總表（進階版）抽 8 家全對（亞泥／群創／欣銓／和友紡織→符合1.5°C目標、超豐／遠東新→承諾設定科學基礎目標、新纖／金元福→打叉記號 U+274C；金元福值為 X，總表設計將 無／X 均顯示為打叉）。網站端待 CI 下次 sync 帶上線。事後依 Joseph 指示逐一查證引用鏈（公式實讀）：raw_國際減碳倡議 A1 的 IMPORTRANGE 指向爬蟲表 1Ys5JuyG…（我們的分頁）；hub 全部 raw_* 分頁錨點掃描，無任何一處引用 qyke 的 xlsx（1AyCyX5zS…）——他改分頁名不影響鏈路，不需新建 tab re-wire。另查明站上「RE100 承諾」欄另有上游（排碳大戶表_Data AD ← raw_LLM 欄位蒐集結果），非 greentrade 這條鏈。
