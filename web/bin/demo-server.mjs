#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = resolve(fileURLToPath(new URL('.', import.meta.url)))
const demoRoot = resolve(here, '../demo')
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

function readPort(argv) {
  const index = argv.indexOf('--port')
  if (index === -1) return 4174
  const value = Number(argv[index + 1])
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('Expected --port to be an integer from 1 to 65535.')
  }
  return value
}

function resolveAsset(requestUrl) {
  const pathname = decodeURIComponent((requestUrl || '/').split('?')[0])
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '')
  const assetPath = resolve(demoRoot, relativePath)
  if (assetPath !== demoRoot && !assetPath.startsWith(`${demoRoot}${sep}`)) return null
  return assetPath
}

function send(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(message)
}

const port = readPort(process.argv)
const server = createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method || '')) {
    send(res, 405, 'Method not allowed')
    return
  }

  const assetPath = resolveAsset(req.url)
  if (!assetPath) {
    send(res, 403, 'Forbidden')
    return
  }
  if (!existsSync(assetPath) || !statSync(assetPath).isFile()) {
    send(res, 404, 'Not found. Run npm run package:demo if web/demo is missing.')
    return
  }

  const contentType = mimeTypes[extname(assetPath).toLowerCase()] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' })
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(assetPath).pipe(res)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Runway static demo: http://127.0.0.1:${port}`)
  console.log('Press Ctrl+C to stop.')
})
