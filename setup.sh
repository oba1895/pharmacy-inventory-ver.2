#!/bin/bash
# 調剤薬局在庫管理システム セットアップスクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "💊 調剤薬局 在庫管理システム - セットアップ"
echo "============================================"
echo ""

# Node.jsの確認
if ! command -v node &> /dev/null; then
  echo "❌ Node.jsが見つかりません。"
  echo ""
  echo "インストール方法:"
  echo "  1. https://nodejs.org/ja/ から LTS版をダウンロード・インストール"
  echo "  または"
  echo "  2. brew install node  (Homebrewがある場合)"
  echo ""
  echo "インストール後、ターミナルを再起動してからこのスクリプトを再実行してください。"
  exit 1
fi

echo "✅ Node.js $(node --version) を検出"

# Xcodeコマンドラインツールの確認（better-sqlite3のビルドに必要な場合がある）
if ! xcode-select -p &> /dev/null; then
  echo ""
  echo "⚠️  Xcode Command Line Tools が見つかりません。"
  echo "   インストールを開始します（better-sqlite3のビルドに必要）..."
  xcode-select --install 2>/dev/null || true
  echo "   インストール完了後、このスクリプトを再実行してください。"
  exit 1
fi

echo "✅ Xcode Command Line Tools を確認"
echo ""
echo "📦 依存関係をインストール中..."
echo ""

# プロジェクトルートへ移動
cd "$SCRIPT_DIR"

# ルートの依存関係
echo "--- ルートパッケージ ---"
npm install

# バックエンドの依存関係
echo ""
echo "--- バックエンド ---"
cd backend && npm install
cd "$SCRIPT_DIR"

# フロントエンドの依存関係
echo ""
echo "--- フロントエンド ---"
cd frontend && npm install
cd "$SCRIPT_DIR"

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "🚀 起動するには:"
echo "   cd $SCRIPT_DIR"
echo "   npm run dev"
echo ""
echo "📱 アクセス先:"
echo "   Mac本体    : http://localhost:5173"
MAC_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "[IPアドレスを確認してください]")
echo "   iPad(WiFi) : http://${MAC_IP}:5173"
echo ""
echo "🔑 ログイン情報:"
echo "   管理者: admin / admin123"
echo "   閲覧者: staff / staff123"
echo ""
