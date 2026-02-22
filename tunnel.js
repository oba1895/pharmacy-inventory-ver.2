#!/usr/bin/env node
/**
 * Cloudflare Tunnel 起動スクリプト
 * cloudflared を自動ダウンロードし、全フロアからアクセス可能なURLを発行します。
 */

const { spawn, execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const https = require('https')
const os = require('os')

const TUNNEL_PORT = 5173
const BIN_DIR = path.join(__dirname, 'bin')
const RELEASE_BASE = 'https://github.com/cloudflare/cloudflared/releases/latest/download'

function getBinaryInfo() {
  const platform = process.platform
  const arch = process.arch

  if (platform === 'darwin') {
    const tgzName = arch === 'arm64' ? 'cloudflared-darwin-arm64.tgz' : 'cloudflared-darwin-amd64.tgz'
    return {
      downloadUrl: `${RELEASE_BASE}/${tgzName}`,
      isTgz: true,
      localPath: path.join(BIN_DIR, 'cloudflared'),
    }
  } else if (platform === 'win32') {
    const exeName = arch === 'arm64' ? 'cloudflared-windows-arm64.exe' : 'cloudflared-windows-amd64.exe'
    return {
      downloadUrl: `${RELEASE_BASE}/${exeName}`,
      isTgz: false,
      localPath: path.join(BIN_DIR, 'cloudflared.exe'),
    }
  } else {
    const binName = arch === 'arm64' ? 'cloudflared-linux-arm64' : 'cloudflared-linux-amd64'
    return {
      downloadUrl: `${RELEASE_BASE}/${binName}`,
      isTgz: false,
      localPath: path.join(BIN_DIR, 'cloudflared'),
    }
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    let redirects = 0

    const get = (targetUrl) => {
      if (redirects > 5) { reject(new Error('Too many redirects')); return }
      https.get(targetUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          redirects++
          get(res.headers.location)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} : ${targetUrl}`)); return
        }
        const total = parseInt(res.headers['content-length'] || '0', 10)
        let received = 0
        res.on('data', (chunk) => {
          received += chunk.length
          if (total > 0) {
            const pct = Math.round((received / total) * 100)
            process.stdout.write(`\r   ダウンロード中... ${pct}%  `)
          }
        })
        res.pipe(file)
        file.on('finish', () => { file.close(); process.stdout.write('\n'); resolve() })
      }).on('error', reject)
    }
    get(url)
  })
}

async function ensureBinary(info) {
  // ファイルが存在し、かつ実際のサイズがある（0バイトでない）場合はスキップ
  if (fs.existsSync(info.localPath) && fs.statSync(info.localPath).size > 1024) return

  if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true })

  console.log('📥 cloudflared を初回ダウンロード中（約30MB）...')
  console.log(`   ${info.downloadUrl}\n`)

  if (info.isTgz) {
    // macOS: tgz をダウンロードして tar で展開
    const tmpTgz = path.join(os.tmpdir(), 'cloudflared.tgz')
    await downloadFile(info.downloadUrl, tmpTgz)
    execSync(`tar -xzf "${tmpTgz}" -C "${BIN_DIR}"`)
    fs.unlinkSync(tmpTgz)
    // 展開後のバイナリ名を確認して正規化
    const extracted = fs.readdirSync(BIN_DIR).find(f => f.startsWith('cloudflared'))
    if (extracted && extracted !== 'cloudflared') {
      fs.renameSync(path.join(BIN_DIR, extracted), info.localPath)
    }
  } else {
    // Windows / Linux: 直接バイナリをダウンロード
    await downloadFile(info.downloadUrl, info.localPath)
  }

  if (process.platform !== 'win32') {
    fs.chmodSync(info.localPath, '755')
  }

  console.log('✅ cloudflared のセットアップ完了\n')
}

async function startTunnel() {
  console.log('\n💊 調剤薬局 在庫管理システム - Cloudflare Tunnel')
  console.log('='.repeat(52))

  const info = getBinaryInfo()
  await ensureBinary(info)

  console.log(`🌐 トンネルを起動中...`)
  console.log('   URLが表示されるまで15〜30秒かかります。\n')

  const proc = spawn(info.localPath, ['tunnel', '--url', `http://localhost:${TUNNEL_PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let urlFound = false

  const handleOutput = (data) => {
    const text = data.toString()
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/)
    if (match && !urlFound) {
      urlFound = true
      const url = match[0]
      console.log('='.repeat(52))
      console.log('🎉 全フロア共通アクセスURL')
      console.log('')
      console.log(`   👉  ${url}`)
      console.log('')
      console.log('iPadのSafariでこのURLを開いてください。')
      console.log('どのフロアのWi-Fiからでもアクセスできます。')
      console.log('※ アプリを再起動するとURLが変わります。')
      console.log('='.repeat(52) + '\n')
    }
  }

  proc.stdout.on('data', handleOutput)
  proc.stderr.on('data', handleOutput)

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ cloudflared が終了しました (code: ${code})`)
    }
  })

  process.on('SIGINT', () => { proc.kill(); process.exit(0) })
  process.on('SIGTERM', () => { proc.kill(); process.exit(0) })

  setTimeout(() => {
    if (!urlFound) {
      console.log('⚠️  URLの取得に時間がかかっています。インターネット接続を確認してください。')
    }
  }, 60000)
}

startTunnel().catch((err) => {
  console.error('❌ エラー:', err.message)
  process.exit(1)
})
