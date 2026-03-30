// Electron main process for Bé Sen AI (CommonJS)
const { app, BrowserWindow, dialog, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow = null

// Single-instance lock to avoid multiple windows/processes
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
let backendProc = null
let ollamaProc = null

const isDev = !app.isPackaged
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

async function waitForUrl(url, { attempts = 60, intervalMs = 500 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return false
}

function createWindow() {
  if (mainWindow) return
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#eff8ef',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  ;(async () => {
    if (isDev) {
      const ok = await waitForUrl(VITE_DEV_SERVER_URL, { attempts: 80, intervalMs: 250 })
      if (!ok) {
        dialog.showErrorBox('Không mở được Vite', 'Vite dev server chưa sẵn sàng. Hãy chạy lại: npm start')
      } else {
        await mainWindow.loadURL(VITE_DEV_SERVER_URL)
      }
    } else {
      await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
    }
    mainWindow.show()
  })()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function ensureOllama() {
  const tryPing = async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags')
      return res.ok
    } catch {
      return false
    }
  }
  const ok = await tryPing()
  if (ok) return

  try {
    ollamaProc = spawn('ollama', ['serve'], { stdio: 'ignore', detached: true })
    ollamaProc.unref()
  } catch {
    dialog.showMessageBoxSync({
      type: 'info',
      title: 'Cần cài Ollama',
      message: 'Ứng dụng cần Ollama để chạy AI cục bộ. Bạn sẽ được chuyển đến trang tải Ollama.',
    })
    shell.openExternal('https://ollama.com/download')
    return
  }

  try {
    const pull = spawn('ollama', ['pull', 'qwen2.5-coder:7b'], { stdio: 'ignore', detached: true })
    pull.unref()
  } catch {}
}

function startBackendIfAny() {
  try {
    const serverPath = path.join(__dirname, '..', '..', 'backend', 'server.js')
    backendProc = spawn(process.execPath, [serverPath], {
      stdio: 'ignore',
      detached: true,
      env: { ...process.env, PORT: process.env.PORT || '5000' },
    })
    backendProc.unref()
  } catch {}
}

// Enforce single instance
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(async () => {
  await ensureOllama()
  // Optional in dev only to avoid multiple spawns on restarts
  if (isDev) {
    startBackendIfAny()
  }
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

