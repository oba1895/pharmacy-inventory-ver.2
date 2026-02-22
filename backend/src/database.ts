import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(__dirname, '../../data')
const DB_PATH = path.join(DB_DIR, 'pharmacy.db')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

export const db = new Database(DB_PATH)

export function initDatabase(): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'viewer')),
      display_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      current_stock INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT '錠',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS pharmacists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS wards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('入庫', '出庫')),
      quantity INTEGER NOT NULL,
      patient_name TEXT,
      date TEXT NOT NULL,
      supplier_id INTEGER,
      pharmacist_id INTEGER NOT NULL,
      ward_id INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (pharmacist_id) REFERENCES pharmacists(id),
      FOREIGN KEY (ward_id) REFERENCES wards(id)
    );
  `)

  // 既存DBにward_idカラムがない場合は追加
  try {
    db.exec('ALTER TABLE transactions ADD COLUMN ward_id INTEGER REFERENCES wards(id)')
  } catch {
    // カラムが既に存在する場合は無視
  }

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count

  if (userCount === 0) {
    // ユーザーシード
    const adminHash = bcrypt.hashSync('admin123', 10)
    const staffHash = bcrypt.hashSync('staff123', 10)
    db.prepare('INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)').run('admin', adminHash, 'admin', '管理者')
    db.prepare('INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)').run('staff', staffHash, 'viewer', 'スタッフ共通')

    // 医薬品シード（在庫数はトランザクション後の最終値）
    const medicines = [
      { name: 'テスト薬A（アスピリン）',      stock: 38, unit: '錠' },
      { name: 'テスト薬B（ロキソプロフェン）', stock: 47, unit: '錠' },
      { name: 'テスト薬C（アモキシシリン）',   stock: 90, unit: 'カプセル' },
      { name: 'テスト薬D（メトホルミン）',     stock: 18, unit: '錠' },
      { name: 'テスト薬E（アトルバスタチン）', stock: 61, unit: '錠' },
    ]
    const insertMed = db.prepare('INSERT INTO medicines (name, current_stock, unit) VALUES (?, ?, ?)')
    for (const m of medicines) insertMed.run(m.name, m.stock, m.unit)

    // 購入先シード
    const suppliers = ['テスト卸業者A', 'テスト卸業者B', 'テスト医薬品卸C', 'テスト製薬会社D']
    const insertSupplier = db.prepare('INSERT INTO suppliers (name) VALUES (?)')
    for (const s of suppliers) insertSupplier.run(s)

    // 薬剤師シード
    const pharmacists = ['山田 薬子', '鈴木 薬郎', '佐藤 薬花']
    const insertPharmacist = db.prepare('INSERT INTO pharmacists (name) VALUES (?)')
    for (const p of pharmacists) insertPharmacist.run(p)

    // トランザクションシード（履歴として記録）
    const insertTx = db.prepare(`
      INSERT INTO transactions
        (medicine_id, transaction_type, quantity, patient_name, date, supplier_id, pharmacist_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const txData = [
      { med: 1, type: '入庫', qty: 50,  patient: null,       date: '2026-02-01', sup: 1, pharm: 1, notes: '初回入庫' },
      { med: 2, type: '入庫', qty: 30,  patient: null,       date: '2026-02-01', sup: 2, pharm: 1, notes: '初回入庫' },
      { med: 3, type: '入庫', qty: 100, patient: null,       date: '2026-02-01', sup: 1, pharm: 2, notes: '初回入庫' },
      { med: 4, type: '入庫', qty: 25,  patient: null,       date: '2026-02-01', sup: 3, pharm: 3, notes: '初回入庫' },
      { med: 5, type: '入庫', qty: 75,  patient: null,       date: '2026-02-01', sup: 2, pharm: 1, notes: '初回入庫' },
      { med: 1, type: '出庫', qty: 5,   patient: '山田 太郎', date: '2026-02-10', sup: null, pharm: 1, notes: null },
      { med: 2, type: '出庫', qty: 3,   patient: '鈴木 次郎', date: '2026-02-12', sup: null, pharm: 2, notes: null },
      { med: 3, type: '出庫', qty: 10,  patient: '佐藤 花子', date: '2026-02-14', sup: null, pharm: 3, notes: null },
      { med: 1, type: '出庫', qty: 7,   patient: '田中 三郎', date: '2026-02-15', sup: null, pharm: 1, notes: null },
      { med: 5, type: '出庫', qty: 14,  patient: '高橋 四郎', date: '2026-02-18', sup: null, pharm: 2, notes: null },
      { med: 2, type: '入庫', qty: 20,  patient: null,       date: '2026-02-18', sup: 1,    pharm: 3, notes: '追加入庫' },
      { med: 4, type: '出庫', qty: 7,   patient: '伊藤 五子', date: '2026-02-20', sup: null, pharm: 1, notes: null },
    ]

    for (const tx of txData) {
      insertTx.run(tx.med, tx.type, tx.qty, tx.patient, tx.date, tx.sup, tx.pharm, tx.notes)
    }

    console.log('✅ データベースを初期化しました（ダミーデータ含む）')
    console.log('   管理者ログイン: admin / admin123')
    console.log('   閲覧者ログイン: staff / staff123')
  } else {
    console.log('✅ データベース接続済み')
  }
}
