import { ipcMain, BrowserWindow, webContents } from 'electron'
import { setupPartitionSession } from './session-manager'
import { handleClaudeChat, handleClaudeChatStream } from './claude-service'

// Registry: frameId -> webContentsId of the webview
const frameRegistry = new Map<string, number>()

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // ── Session setup ─────────────────────────────────────────────────────────
  ipcMain.handle('session:setup-partition', (_event, partition: string) => {
    setupPartitionSession(partition)
    return { ok: true }
  })

  // ── Webview registry ──────────────────────────────────────────────────────
  ipcMain.handle('frame:register', (_event, frameId: string, webContentsId: number) => {
    frameRegistry.set(frameId, webContentsId)
    return { ok: true }
  })

  ipcMain.handle('frame:unregister', (_event, frameId: string) => {
    frameRegistry.delete(frameId)
    return { ok: true }
  })

  // ── JavaScript injection ──────────────────────────────────────────────────
  ipcMain.handle('frame:execute-js', async (_event, frameId: string, code: string) => {
    const wcId = frameRegistry.get(frameId)
    if (wcId == null) return { error: `Frame '${frameId}' not registered` }

    const wc = webContents.fromId(wcId)
    if (!wc) return { error: `WebContents ${wcId} no longer exists` }

    try {
      const result = await wc.executeJavaScript(code, true)
      return { result }
    } catch (err: unknown) {
      return { error: String(err) }
    }
  })

  // ── Navigation ────────────────────────────────────────────────────────────
  ipcMain.handle('frame:navigate', (_event, frameId: string, url: string) => {
    const wcId = frameRegistry.get(frameId)
    if (wcId == null) return { error: `Frame '${frameId}' not registered` }

    const wc = webContents.fromId(wcId)
    if (!wc) return { error: `WebContents ${wcId} no longer exists` }

    wc.loadURL(url)
    return { ok: true }
  })

  // ── Screenshot ────────────────────────────────────────────────────────────
  ipcMain.handle('frame:screenshot', async (_event, frameId: string) => {
    const wcId = frameRegistry.get(frameId)
    if (wcId == null) return { error: `Frame '${frameId}' not registered` }

    const wc = webContents.fromId(wcId)
    if (!wc) return { error: `WebContents ${wcId} no longer exists` }

    try {
      const image = await wc.capturePage()
      const base64 = image.toPNG().toString('base64')
      return { base64, mimeType: 'image/png' }
    } catch (err: unknown) {
      return { error: String(err) }
    }
  })

  // ── Send keyboard input ───────────────────────────────────────────────────
  ipcMain.handle('frame:send-input', (_event, frameId: string, text: string) => {
    const wcId = frameRegistry.get(frameId)
    if (wcId == null) return { error: `Frame '${frameId}' not registered` }

    const wc = webContents.fromId(wcId)
    if (!wc) return { error: `WebContents ${wcId} no longer exists` }

    for (const char of text) {
      wc.sendInputEvent({ type: 'char', keyCode: char })
    }
    return { ok: true }
  })

  // ── Claude AI chat ────────────────────────────────────────────────────────
  ipcMain.handle('claude:chat', async (event, messages: ClaudeMessage[], apiKey: string) => {
    return handleClaudeChat(messages, apiKey, mainWindow)
  })

  // Streaming version
  ipcMain.handle(
    'claude:chat-stream',
    async (event, messages: ClaudeMessage[], apiKey: string) => {
      return handleClaudeChatStream(messages, apiKey, mainWindow)
    }
  )

  // ── Utility ───────────────────────────────────────────────────────────────
  ipcMain.handle('frame:list', () => {
    return Array.from(frameRegistry.keys())
  })
}

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}
