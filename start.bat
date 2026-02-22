@echo off
chcp 65001 > nul
title 調剤薬局 在庫管理システム

echo.
echo  💊 調剤薬局 在庫管理システム
echo ==========================================
echo.

:: Node.jsの確認
node --version > nul 2>&1
if errorlevel 1 (
  echo ❌ Node.jsが見つかりません。
  echo.
  echo 以下のURLからNode.js LTSをインストールしてください:
  echo https://nodejs.org/ja/
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%i in ('node --version') do set NODE_VER=%%i
echo ✅ Node.js %NODE_VER%

:: node_modulesがなければインストール
if not exist "node_modules" (
  echo 📦 初回セットアップ中（数分かかります）...
  call npm install
)
if not exist "backend\node_modules" (
  cd backend && call npm install && cd ..
)
if not exist "frontend\node_modules" (
  cd frontend && call npm install && cd ..
)

echo.
echo 起動モードを選択してください:
echo   [1] 通常起動  - 同じWi-Fi内のiPadのみアクセス可
echo   [2] トンネル起動 - 全フロア・異なるWi-Fiからもアクセス可（推奨）
echo.
set /p MODE="番号を入力してEnter (デフォルト:2): "
if "%MODE%"=="" set MODE=2

if "%MODE%"=="1" (
  echo.
  echo 🚀 通常起動中...
  echo ブラウザで http://localhost:5173 を開いてください。
  echo.
  call npm run dev
) else (
  echo.
  echo 🚀 トンネル起動中...
  echo しばらくするとアクセスURLが表示されます。
  echo.
  call npm run dev:tunnel
)

pause
