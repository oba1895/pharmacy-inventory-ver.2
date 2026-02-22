# 💊 調剤薬局 在庫管理システム

iPadブラウザに完全対応した調剤薬局向け医薬品在庫管理Webアプリです。

---

## 📋 セットアップ手順

### Step 1: Node.jsのインストール（初回のみ）

Node.jsがインストールされていない場合は、まずインストールが必要です。

**方法A: 公式サイトから（推奨）**
1. https://nodejs.org/ja/ にアクセス
2. 「LTS（推奨版）」をダウンロード・インストール
3. インストール後、ターミナルを再起動

**方法B: Homebrewから**
```bash
# Homebrewがない場合は先にインストール
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.jsをインストール
brew install node
```

Node.jsがインストールできたか確認:
```bash
node --version   # v20.x.x などと表示されればOK
npm --version
```

---

### Step 2: 依存関係のインストール（初回のみ）

```bash
# プロジェクトフォルダに移動
cd ~/Desktop/Claude_Workspace/pharmacy-inventory

# 依存関係を一括インストール
npm run install:all
```

---

### Step 3: アプリの起動

```bash
cd ~/Desktop/Claude_Workspace/pharmacy-inventory
npm run dev
```

起動後、以下のURLでアクセスできます:
- **Mac本体から**: http://localhost:5173
- **iPad（同じWi-Fi）から**: http://[MacのIPアドレス]:5173

**MacのIPアドレスの確認方法:**
- システム設定 → Wi-Fi → 詳細 → IPアドレス
- または: `ipconfig getifaddr en0` をターミナルで実行

---

## 🔑 ログイン情報

| 役割 | ユーザー名 | パスワード | 用途 |
|------|-----------|------------|------|
| 管理者 | `admin` | `admin123` | 調剤室（入出庫入力・編集・削除） |
| 閲覧者 | `staff` | `staff123` | モニター用（在庫・履歴の閲覧のみ） |

---

## 📱 機能一覧

### 管理者（admin）
- **在庫一覧**: 現在の医薬品在庫をリアルタイム確認
- **受払入力**: 入庫・出庫の記録（プルダウン選択式）
- **受払履歴**: 過去の受払記録の閲覧・編集・削除
- **マスタ管理**: 医薬品・購入先・薬剤師の追加/削除

### 閲覧者（staff）
- **在庫一覧**: 現在の在庫を閲覧（30秒ごと自動更新）
- **受払履歴**: 患者氏名フルネームを含む履歴の閲覧

### セキュリティ
- **自動ロックアウト**: 5分間操作がないと画面に強いぼかしがかかりロック
- ロック解除にはパスワードが必要
- JWT認証（24時間有効）

---

## 🗂️ プロジェクト構成

```
pharmacy-inventory/
├── backend/          # Express + TypeScript + SQLite
│   └── src/
│       ├── index.ts
│       ├── database.ts    # DB初期化 + ダミーデータ
│       ├── middleware/auth.ts
│       └── routes/
│           ├── auth.ts
│           ├── medicines.ts
│           ├── transactions.ts
│           └── master.ts
├── frontend/         # React + Vite + Tailwind CSS
│   └── src/
│       ├── App.tsx
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── AdminPage.tsx
│       │   └── ViewerPage.tsx
│       └── components/
│           ├── AutoLockOverlay.tsx
│           ├── InventoryTable.tsx
│           ├── TransactionForm.tsx
│           ├── TransactionHistory.tsx
│           └── MasterDataManager.tsx
└── data/             # SQLiteデータベース（自動生成）
    └── pharmacy.db
```

---

## ⚙️ ポート構成

| サービス | ポート | 用途 |
|---------|--------|------|
| フロントエンド (Vite) | 5173 | iPad/ブラウザからアクセス |
| バックエンド (Express) | 3001 | API サーバー（Viteがプロキシ） |

---

## 🔧 よくある問題

**「ポートが使用中」エラー**
```bash
# 使用中のプロセスを確認・停止
lsof -ti:5173 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**データをリセットしたい場合**
```bash
rm data/pharmacy.db
npm run dev  # 再起動でダミーデータが再生成される
```
