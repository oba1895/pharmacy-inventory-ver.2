import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '../../.env') })

import express from 'express'
import cors from 'cors'
import { initDatabase } from './database'
import authRouter from './routes/auth'
import medicinesRouter from './routes/medicines'
import transactionsRouter from './routes/transactions'
import masterRouter from './routes/master'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

initDatabase()

app.use('/api/auth', authRouter)
app.use('/api/medicines', medicinesRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/master', masterRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const adminPin = process.env.ADMIN_PIN || '1234'
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n💊 調剤薬局 在庫管理システム - バックエンドサーバー')
  console.log(`📡 ポート ${PORT} で起動中`)
  console.log(`🔑 管理者PIN: ${adminPin}`)
  console.log('   ※ PINを変更するには .env ファイルの ADMIN_PIN を編集してください\n')
})
