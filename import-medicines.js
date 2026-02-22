/**
 * 薬品一括インポートスクリプト
 *
 * 使い方:
 *   node import-medicines.js <CSVファイルパス>
 *
 * CSVフォーマット:
 *   1列目: 薬品名（必須）
 *   2列目: 単位（任意。省略すると「錠」になる）
 *
 * 例:
 *   アスピリン錠100mg,錠
 *   アモキシシリンカプセル250mg,カプセル
 *   生理食塩水500mL,本
 *
 * ヘッダー行（1行目が「薬品名」で始まる場合）は自動でスキップします。
 * 既に登録済みの薬品はスキップします（エラーにはなりません）。
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const DB_PATH = path.join(__dirname, 'data', 'pharmacy.db')
const csvFile = process.argv[2]

if (!csvFile) {
  console.error('使い方: node import-medicines.js <CSVファイルパス>')
  console.error('例:     node import-medicines.js medicines.csv')
  process.exit(1)
}

if (!fs.existsSync(csvFile)) {
  console.error(`エラー: ファイルが見つかりません → ${csvFile}`)
  process.exit(1)
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`エラー: データベースが見つかりません → ${DB_PATH}`)
  console.error('先にアプリを一度起動してDBを初期化してください。')
  process.exit(1)
}

function runSql(sql) {
  return execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf-8' }).trim()
}

const lines = fs.readFileSync(csvFile, 'utf-8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(l => l.length > 0)

console.log(`\n読み込み: ${csvFile}`)
console.log(`行数: ${lines.length}\n`)

let added = 0
let skipped = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const cols = line.split(',').map(c => c.trim())
  const name = cols[0]
  const unit = cols[1] || '錠'

  // ヘッダー行スキップ
  if (i === 0 && (name === '薬品名' || name === '医薬品名' || name === 'name')) {
    console.log('  （ヘッダー行をスキップ）')
    continue
  }

  if (!name) {
    console.warn(`  行${i + 1}: 薬品名が空のためスキップ`)
    skipped++
    continue
  }

  // シングルクォートをエスケープ
  const safeName = name.replace(/'/g, "''")
  const safeUnit = unit.replace(/'/g, "''")

  try {
    // 既存チェック
    const exists = runSql(`SELECT COUNT(*) FROM medicines WHERE name='${safeName}';`)
    if (exists === '1') {
      console.log(`  スキップ（既存）: ${name}`)
      skipped++
      continue
    }

    runSql(`INSERT INTO medicines (name, current_stock, unit) VALUES ('${safeName}', 0, '${safeUnit}');`)
    console.log(`  追加: ${name}（${unit}）`)
    added++
  } catch (e) {
    console.error(`  エラー: ${name} → ${e.message}`)
  }
}

console.log('\n=============================')
console.log(`完了: ${added} 件追加 / ${skipped} 件スキップ`)
console.log('=============================\n')
