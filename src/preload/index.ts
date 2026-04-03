import { contextBridge, ipcRenderer } from 'electron'

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // ── Frame management ────────────────────────────────────────────────────
  registerFrame: (frameId: string, webContentsId: number) =>
    ipcRenderer.invoke('frame:register', frameId, webContentsId),

  unregisterFrame: (frameId: string) => ipcRenderer.invoke('frame:unregister', frameId),

  setupPartition: (partition: string) =>
    ipcRenderer.invoke('session:setup-partition', partition),

  // ── Frame control ────────────────────────────────────────────────────────
  executeFrameJs: (frameId: string, code: string) =>
    ipcRenderer.invoke('frame:execute-js', frameId, code),

  navigateFrame: (frameId: string, url: string) =>
    ipcRenderer.invoke('frame:navigate', frameId, url),

  screenshotFrame: (frameId: string) => ipcRenderer.invoke('frame:screenshot', frameId),

  sendFrameInput: (frameId: string, text: string) =>
    ipcRenderer.invoke('frame:send-input', frameId, text),

  listFrames: () => ipcRenderer.invoke('frame:list'),

  // ── Claude AI ────────────────────────────────────────────────────────────
  claudeChat: (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    apiKey: string
  ) => ipcRenderer.invoke('claude:chat', messages, apiKey),

  // Event listeners (push from main)
  onToolExecuting: (callback: (data: { tool: string; input: unknown }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { tool: string; input: unknown }) =>
      callback(data)
    ipcRenderer.on('claude:tool-executing', handler)
    return () => ipcRenderer.removeListener('claude:tool-executing', handler)
  },

  onStreamDelta: (callback: (delta: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, delta: string) => callback(delta)
    ipcRenderer.on('claude:stream-delta', handler)
    return () => ipcRenderer.removeListener('claude:stream-delta', handler)
  }
})

// Type declaration merged into window
declare global {
  interface Window {
    electronAPI: {
      registerFrame: (frameId: string, webContentsId: number) => Promise<{ ok: boolean }>
      unregisterFrame: (frameId: string) => Promise<{ ok: boolean }>
      setupPartition: (partition: string) => Promise<{ ok: boolean }>
      executeFrameJs: (frameId: string, code: string) => Promise<unknown>
      navigateFrame: (frameId: string, url: string) => Promise<{ ok: boolean }>
      screenshotFrame: (frameId: string) => Promise<{ base64: string; mimeType: string } | { error: string }>
      sendFrameInput: (frameId: string, text: string) => Promise<{ ok: boolean }>
      listFrames: () => Promise<string[]>
      claudeChat: (
        messages: Array<{ role: 'user' | 'assistant'; content: string }>,
        apiKey: string
      ) => Promise<{ response: string; toolsUsed: string[] }>
      onToolExecuting: (callback: (data: { tool: string; input: unknown }) => void) => () => void
      onStreamDelta: (callback: (delta: string) => void) => () => void
    }
  }
}
