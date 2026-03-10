# 🍵 調茶員 Tea Detective

> 連鎖飲料店集點 × QR Code 點餐 SaaS 平台 Demo

![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![License](https://img.shields.io/badge/License-MIT-green)

## 📋 專案簡介

「調茶員 Tea Detective」是一套為連鎖飲料商家設計的集點與 QR Code 點餐 SaaS 系統 Demo，包含：

- **📱 顧客端 App**（手機模擬介面）— 掃碼點餐、集點、兌換獎勵、訂單追蹤
- **💻 商家後台 Dashboard** — 數據總覽、訂單管理、菜單管理、集點活動、門市管理、會員管理

兩端即時連動：顧客下單後後台立即看到新訂單，數據即時更新。

---

## ✨ 功能特色

### 顧客端
- 門市切換（支援多分店）
- 完整點餐流程（甜度/冰塊/加料客製化）
- 購物車管理（新增、刪除、查看）
- 集點系統（活動期間自動倍率加成）
- 獎勵兌換 → 自動產生票券
- 票券使用（第二杯半價、升級大杯、買一送一等）
- 訂單歷史紀錄

### 商家後台
- 即時數據總覽（全品牌加總）
- 訂單即時管理（接單/製作/完成）
- 菜單 CRUD（新增/編輯/刪除/上下架）
- 集點活動管理（規則/限時活動/獎勵/會員等級）
- 門市管理（資訊編輯/QR Code 產生）
- 會員搜尋與報表匯出
- 熱銷排行即時更新（含票券折扣精準計算）

### 前後台連動
- 顧客點餐 → 後台訂單管理即時出現
- 門市營收/訂單數/點數發放即時更新
- 活動期間調整 → 顧客端點數倍率即時連動
- 切換前後台時頁面狀態保留

---

## 🚀 快速開始

### 環境需求
- Node.js 18+
- npm 或 yarn

### 安裝與啟動

```bash
# 1. 進入專案目錄
cd orderdot-tea-detective

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm run dev

# 4. 開啟瀏覽器訪問
# http://localhost:3000
```

### 打包部署

```bash
npm run build
# 產出靜態檔案於 dist/ 資料夾
```

---

## 📁 專案結構

```
orderdot-tea-detective/
├── App.jsx             # 主應用程式（顧客端 + 商家後台）
├── main.jsx            # React 入口
├── index.html          # HTML 入口
├── package.json        # 依賴與腳本
├── vite.config.js      # Vite 設定
├── .gitignore          # Git 忽略規則
├── LICENSE             # MIT 授權
└── README.md           # 本文件
```

---

## 🛠 技術棧

| 技術 | 用途 |
|------|------|
| React 18 | UI 框架 |
| Vite 5 | 開發/打包工具 |
| Recharts | 後台數據圖表 |
| CSS-in-JS (inline) | 樣式管理 |
| React Context | 全域狀態管理 |
| SVG | 品牌 Logo |

---

## 📱 Demo 展示建議

1. **先展示顧客端** — 選門市 → 點餐 → 加購物車 → 使用票券 → 結帳 → 看集點入帳
2. **切換到商家後台** — 看到新訂單出現 → 接受製作 → 標記完成 → 數據已更新
3. **展示活動管理** — 在後台修改活動期間 → 切回顧客端看倍率即時變化

---

## 📄 License

MIT License

---

## 👤 作者

調茶員 Tea Detective SaaS Demo
