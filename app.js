const express = require('express')
const https   = require('https')
const http    = require('http')

const app  = express()
app.use(express.json())

const TARGET = 'https://vexurion.kesug.com'

function forward(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const url  = new URL(TARGET + path)
    const mod  = url.protocol === 'https:' ? https : http
    const req  = mod.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent':     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':         'application/json, text/plain, */*',
        'Origin':         TARGET,
        'Referer':        TARGET + '/',
        'X-Requested-With': 'XMLHttpRequest'
      },
      rejectUnauthorized: false
    }, res => {
      let raw = ''
      res.on('data', d => raw += d)
      res.on('end', () => {
        console.log('[proxy]', path, '| status:', res.statusCode, '| resposta:', raw.substring(0, 150))
        try { resolve(JSON.parse(raw)) }
        catch { reject(new Error('Resposta inválida: ' + raw.slice(0, 200))) }
      })
    })
    req.on('error', reject)
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(data)
    req.end()
  })
}

app.post('/login',  async (req, res) => {
  try { res.json(await forward('/api/desktop-login.php',  req.body)) }
  catch (e) { res.json({ ok: false, message: e.message }) }
})

app.post('/verify', async (req, res) => {
  try { res.json(await forward('/api/desktop-verify.php', req.body)) }
  catch (e) { res.json({ ok: false, message: e.message }) }
})

app.get('/', (_, res) => res.send('WatermarkPro Proxy OK'))

app.listen(process.env.PORT || 3000, () => console.log('Proxy rodando'))
