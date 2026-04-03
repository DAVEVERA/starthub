import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FrameConfig {
  id: string
  url: string
  label: string
  flexGrow: number // relative size weight (1 = equal)
}

export interface LayoutPreset {
  name: string
  columns: number
  rows: number
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { name: '1×1', columns: 1, rows: 1 },
  { name: '2×1', columns: 2, rows: 1 },
  { name: '3×1', columns: 3, rows: 1 },
  { name: '4×1', columns: 4, rows: 1 },
  { name: '2×2', columns: 2, rows: 2 },
  { name: '3×2', columns: 3, rows: 2 }
]

const DEFAULT_FRAMES: FrameConfig[] = [
  { id: 'frame-0', url: 'https://claude.ai', label: 'Claude', flexGrow: 1 },
  { id: 'frame-1', url: 'https://chatgpt.com', label: 'ChatGPT', flexGrow: 1 },
  { id: 'frame-2', url: 'https://gemini.google.com', label: 'Gemini', flexGrow: 1 },
  { id: 'frame-3', url: 'https://www.youtube.com', label: 'YouTube', flexGrow: 1 }
]

interface LayoutState {
  frames: FrameConfig[]
  columns: number
  rows: number
  chatHeight: number // px height of the chatbox panel
  apiKey: string

  // Actions
  setFrames: (frames: FrameConfig[]) => void
  updateFrame: (id: string, updates: Partial<FrameConfig>) => void
  addFrame: () => void
  removeFrame: (id: string) => void
  reorderFrames: (from: number, to: number) => void
  setColumns: (columns: number) => void
  setRows: (rows: number) => void
  applyPreset: (preset: LayoutPreset) => void
  setChatHeight: (height: number) => void
  setApiKey: (key: string) => void
  setFrameFlexGrow: (id: string, flexGrow: number) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      frames: DEFAULT_FRAMES,
      columns: 4,
      rows: 1,
      chatHeight: 260,
      apiKey: '',

      setFrames: (frames) => set({ frames }),

      updateFrame: (id, updates) =>
        set((state) => ({
          frames: state.frames.map((f) => (f.id === id ? { ...f, ...updates } : f))
        })),

      addFrame: () => {
        const state = get()
        const newId = `frame-${Date.now()}`
        set({
          frames: [
            ...state.frames,
            { id: newId, url: 'https://www.google.com', label: 'Nieuw', flexGrow: 1 }
          ]
        })
      },

      removeFrame: (id) =>
        set((state) => ({
          frames: state.frames.filter((f) => f.id !== id)
        })),

      reorderFrames: (from, to) => {
        const state = get()
        const frames = [...state.frames]
        const [moved] = frames.splice(from, 1)
        frames.splice(to, 0, moved)
        set({ frames })
      },

      setColumns: (columns) => set({ columns }),
      setRows: (rows) => set({ rows }),

      applyPreset: (preset) => {
        const state = get()
        const needed = preset.columns * preset.rows
        let frames = [...state.frames]
        // Add frames if needed
        while (frames.length < needed) {
          frames.push({
            id: `frame-${Date.now()}-${frames.length}`,
            url: 'https://www.google.com',
            label: `Frame ${frames.length + 1}`,
            flexGrow: 1
          })
        }
        set({ columns: preset.columns, rows: preset.rows, frames: frames.slice(0, needed) })
      },

      setChatHeight: (height) => set({ chatHeight: Math.max(120, Math.min(600, height)) }),

      setApiKey: (key) => set({ apiKey: key }),

      setFrameFlexGrow: (id, flexGrow) =>
        set((state) => ({
          frames: state.frames.map((f) => (f.id === id ? { ...f, flexGrow } : f))
        }))
    }),
    {
      name: 'starthub-layout',
      partialize: (state) => ({
        frames: state.frames,
        columns: state.columns,
        rows: state.rows,
        chatHeight: state.chatHeight,
        apiKey: state.apiKey
      })
    }
  )
)
