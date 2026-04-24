# 宿舍電力與門禁管理系統

多校宿舍用電與門禁控制的 Node.js 管理平台，透過 RS485 串列埠與硬體電表通訊，並提供各校專屬的網頁操作介面。

## 功能概述

- 即時讀取各房間電表數據（110V / 220V）
- 電費模式設定與切換
- 住戶資料管理（新增、修改、遷移）
- 房間初始化與硬體設定
- 悠遊卡 / iPass 門禁控制
- WebSocket 即時推播操作記錄

## 支援學校

| 路徑 | 學校 |
|------|------|
| `/ntut` | 國立臺北科技大學 |
| `/oit` | 亞東科技大學 |
| `/knu` | 開南大學 |
| `/cpu` | 中央警察大學 |
| `/hk` | HK |
| `/settings` | 系統設定 |

## 環境需求

- Node.js 18+
- Windows（需連接 RS485 轉 USB 轉接器）
- RS485 硬體

## 安裝與啟動

```bash
# 安裝相依套件
npm install

# 複製環境設定檔並修改
cp .env_example .env

# 啟動服務
npm start
```

啟動後：
- 網頁介面：`http://127.0.0.1:3001`
- WebSocket：`ws://127.0.0.1:5000`

## 環境變數設定（`.env`）

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `WEB_PORT` | `3001` | Express 網頁伺服器埠號 |
| `COM_PORT` | `COM7` | RS485 串列埠名稱 |
| `BAUD_RATE` | `57600` | 串列埠傳輸速率 |
| `PAYMENT_METHOD` | `EasyCard` | 支付方式（`EasyCard` 或 `iPass`） |
| `DEFAULT_DONG` | `A` | 預設棟別識別碼 |

> `settings` 資料表中儲存的 COM 埠設定優先於 `.env` 的設定，可在 `/settings` 頁面中修改。

## 系統架構

```
瀏覽器
  │  POST /command { module, args }
  ▼
app.js（Express）
  │
  ▼
communication_js/index.js（指令分派）
  │
  ├─ Data/dal/        SQLite 查詢
  ├─ SerialDataHandler.js   RS485 封包傳送（100 bytes，3 次重試）
  └─ websocket/ws.js  廣播操作結果給所有 WebSocket 客戶端
```

### 硬體封包格式

每筆封包固定 100 bytes：

| 位置 | 說明 |
|------|------|
| byte[0] | 標頭 `0x55` |
| byte[91–96] | 時間戳記 |
| byte[97] | Checksum |
| byte[99] | 結尾 `0x0A` |

### 資料庫結構

SQLite，啟用 WAL 模式，主要資料表：

| 資料表 | 說明 |
|--------|------|
| `settings` | 系統金鑰值設定（COM 埠、棟別等） |
| `host` | 棟別／建築設定 |
| `room` | 房間與電表資料 |
| `member` | 住戶資料（卡號、餘額、用電狀態） |
| `center_id_card` | 中控門禁卡資料 |
| `log_data` | 操作記錄 |

## 前端結構

各學校前端模組位於 `static/js/<school>/`，每個模組包含相同的檔案結構：

| 檔案 | 功能 |
|------|------|
| `index.js` | 主控制器 |
| `type.js` | 資料型別定義 |
| `table.js` | 表格渲染 |
| `modeParser.js` | 計費模式位元解析 |
| `search.js` | 搜尋過濾 |
| `commandBtn.js` | 硬體指令按鈕 |
| `move.js` | 房間／住戶遷移 |

## 主要 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| `POST` | `/command` | 送出硬體指令 `{ module, args }` |
| `GET` | `/api/settings` | 讀取系統設定 |
| `PUT` | `/api/settings` | 更新系統設定 |
| `GET` | `/api/settings/com-ports` | 列出可用 COM 埠 |
