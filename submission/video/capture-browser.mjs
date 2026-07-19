#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const projectRoot = path.resolve(import.meta.dirname, '..', '..')
const defaults = {
  duration: 92,
  edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  output: path.join(projectRoot, '.cache', 'browser-live-capture.mp4'),
  port: 9333,
  url: 'http://127.0.0.1:4176/?recording=1&delay=2000',
}

function option(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const duration = Number(option('--duration') ?? defaults.duration)
const edgePath = path.resolve(option('--edge') ?? defaults.edge)
const outputPath = path.resolve(option('--output') ?? defaults.output)
const port = Number(option('--port') ?? defaults.port)
const pageUrl = option('--url') ?? defaults.url
const cacheRoot = path.join(projectRoot, '.cache')
const framesRoot = path.join(cacheRoot, 'browser-cdp-frames')
const profileRoot = path.join(cacheRoot, 'edge-cdp-profile')
const concatPath = path.join(cacheRoot, 'browser-cdp-frames.ffconcat')

if (!Number.isFinite(duration) || duration < 5) throw new Error('Duration must be at least five seconds.')
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid remote-debugging port.')

await mkdir(cacheRoot, { recursive: true })
await rm(framesRoot, { recursive: true, force: true })
await mkdir(framesRoot, { recursive: true })
await mkdir(path.dirname(outputPath), { recursive: true })

const edge = spawn(edgePath, [
  '--headless=new',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-features=Translate,MediaRouter',
  '--disable-renderer-backgrounding',
  '--disable-sync',
  '--force-device-scale-factor=1',
  '--hide-scrollbars',
  '--mute-audio',
  '--no-first-run',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileRoot}`,
  '--window-size=1280,720',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true })

let edgeErrors = ''
edge.stderr.on('data', (chunk) => { edgeErrors += chunk.toString() })

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function waitForTarget() {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)
      const targets = await response.json()
      const target = targets.find((item) => item.type === 'page' && item.url === 'about:blank')
        ?? targets.find((item) => item.type === 'page' && !item.url.startsWith('edge://'))
      if (target?.webSocketDebuggerUrl) return target
    } catch {
      // Edge is still starting.
    }
    await sleep(150)
  }
  throw new Error(`Edge DevTools target did not start. ${edgeErrors.trim()}`)
}

const target = await waitForTarget()
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let commandId = 0
const pending = new Map()
const eventListeners = new Map()

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
    return
  }
  for (const listener of eventListeners.get(message.method) ?? []) listener(message.params)
})

function cdp(method, params = {}) {
  const id = ++commandId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

function on(method, listener) {
  const listeners = eventListeners.get(method) ?? []
  listeners.push(listener)
  eventListeners.set(method, listeners)
}

const loaded = new Promise((resolve) => on('Page.loadEventFired', resolve))
await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 720,
  deviceScaleFactor: 1,
  mobile: false,
  screenWidth: 1280,
  screenHeight: 720,
})
await cdp('Page.navigate', { url: pageUrl })
await loaded

const frames = []
const writes = []
let firstTimestamp = null
let lastTimestamp = null
let frameNumber = 0

on('Page.screencastFrame', (frame) => {
  firstTimestamp ??= frame.metadata.timestamp
  lastTimestamp = frame.metadata.timestamp
  frameNumber += 1
  const filename = `frame-${String(frameNumber).padStart(6, '0')}.jpg`
  const framePath = path.join(framesRoot, filename)
  frames.push({ framePath, time: frame.metadata.timestamp - firstTimestamp })
  writes.push(writeFile(framePath, Buffer.from(frame.data, 'base64')))
  void cdp('Page.screencastFrameAck', { sessionId: frame.sessionId })
})

await cdp('Page.startScreencast', {
  format: 'jpeg',
  quality: 88,
  maxWidth: 1280,
  maxHeight: 720,
  everyNthFrame: 1,
})

console.log(`Recording isolated live browser for ${duration} seconds...`)
await sleep(duration * 1000)
await cdp('Page.stopScreencast')
await Promise.all(writes)

if (frames.length < 10) throw new Error(`Only ${frames.length} browser frames were captured.`)

const lines = ['ffconcat version 1.0']
for (let index = 0; index < frames.length; index += 1) {
  const frame = frames[index]
  const nextTime = frames[index + 1]?.time ?? duration
  const frameDuration = Math.max(0.016, Math.min(duration - frame.time, nextTime - frame.time))
  const escaped = frame.framePath.replaceAll('\\', '/').replaceAll("'", "'\\''")
  lines.push(`file '${escaped}'`)
  lines.push(`duration ${frameDuration.toFixed(6)}`)
}
lines.push(`file '${frames.at(-1).framePath.replaceAll('\\', '/').replaceAll("'", "'\\''")}'`)
await writeFile(concatPath, `${lines.join('\n')}\n`)

const ffmpeg = spawn('ffmpeg', [
  '-hide_banner',
  '-loglevel', 'warning',
  '-y',
  '-f', 'concat',
  '-safe', '0',
  '-i', concatPath,
  '-vf', 'fps=30,format=yuv420p',
  '-t', String(duration),
  '-an',
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-crf', '14',
  '-movflags', '+faststart',
  outputPath,
], { stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true })
const ffmpegCode = await new Promise((resolve) => ffmpeg.on('exit', resolve))
if (ffmpegCode !== 0) throw new Error(`ffmpeg exited with code ${ffmpegCode}.`)

try {
  await cdp('Browser.close')
} catch {
  edge.kill()
}
socket.close()
await rm(framesRoot, { recursive: true, force: true })

console.log(`Captured ${frames.length} authentic browser frames across ${(lastTimestamp - firstTimestamp).toFixed(2)} seconds.`)
console.log(outputPath)
