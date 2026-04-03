import React, { useState } from 'react'
import type { FrameConfig } from '../../store/layout'
import { useLayoutStore } from '../../store/layout'

interface Props {
  frame: FrameConfig
  onClose: () => void
}

export function FrameConfigModal({ frame, onClose }: Props): JSX.Element {
  const { updateFrame } = useLayoutStore()
  const [url, setUrl] = useState(frame.url)
  const [label, setLabel] = useState(frame.label)

  const handleSave = (): void => {
    let finalUrl = url.trim()
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }
    updateFrame(frame.id, { url: finalUrl, label: label.trim() || 'Frame' })
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onClose()
  }

  const QUICK_URLS = [
    { label: 'Claude', url: 'https://claude.ai' },
    { label: 'ChatGPT', url: 'https://chatgpt.com' },
    { label: 'Gemini', url: 'https://gemini.google.com' },
    { label: 'YouTube', url: 'https://www.youtube.com' },
    { label: 'Google', url: 'https://www.google.com' },
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'Perplexity', url: 'https://www.perplexity.ai' },
    { label: 'Notion', url: 'https://www.notion.so' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="bg-hub-surface border border-hub-border rounded-lg shadow-2xl w-full max-w-md p-6"
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-hub-text text-lg font-semibold mb-4">Frame instellen</h2>

        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-hub-muted text-xs mb-1">Naam</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-hub-bg border border-hub-border rounded px-3 py-2 text-hub-text text-sm focus:outline-none focus:border-hub-accent"
              placeholder="Framenaam"
              autoFocus
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-hub-muted text-xs mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-hub-bg border border-hub-border rounded px-3 py-2 text-hub-text text-sm focus:outline-none focus:border-hub-accent"
              placeholder="https://..."
            />
          </div>

          {/* Quick picks */}
          <div>
            <label className="block text-hub-muted text-xs mb-2">Snel kiezen</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_URLS.map((q) => (
                <button
                  key={q.url}
                  onClick={() => {
                    setUrl(q.url)
                    setLabel(q.label)
                  }}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    url === q.url
                      ? 'bg-hub-accent border-hub-accent text-white'
                      : 'border-hub-border text-hub-muted hover:border-hub-accent hover:text-hub-text'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frame ID info */}
          <div className="text-hub-muted text-xs">
            Frame ID: <code className="font-mono text-hub-accent">{frame.id}</code>
            <br />
            <span className="text-xs opacity-60">
              Gebruik dit ID in de chatbox: &quot;lees frame {frame.id}&quot;
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-hub-muted hover:text-hub-text border border-hub-border rounded transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-hub-accent rounded hover:bg-opacity-80 transition-colors"
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}
