import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { setupSessionManager } from './session-manager'
import { registerIpcHandlers } from './ipc-handlers'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: false, // start windowed; user can go fullscreen with F11
    frame: true,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // needed for cross-origin webview access
    }
  })

  // Setup session manager (X-Frame-Options bypass)
  setupSessionManager()

  // Register all IPC handlers, passing mainWindow reference
  registerIpcHandlers(mainWindow)

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
