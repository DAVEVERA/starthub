import React, { useState } from 'react'
import { useLayoutStore, LAYOUT_PRESETS } from '../../store/layout'

interface Props {
  onClose: () => void
}

export function SettingsPanel({ onClose }: Props): JSX.Element {
  const { apiKey, setApiKey, frames, addFrame, applyPreset, columns, rows } = useLayoutStore()
  const [keyInput, setKeyInput] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)

  const handleSaveKey = (): void => {
    setApiKey(keyInput.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-hub-surface border border-hub-border rounded-lg shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-hub-text text-lg font-semibold">StartHub Instellingen</h2>
          <button
            onClick={onClose}
            className="text-hub-muted hover:text-hub-text transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* API Key */}
          <section>
            <h3 className="text-hub-text text-sm font-medium mb-3">Claude API-sleutel</h3>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="flex-1 bg-hub-bg border border-hub-border rounded px-3 py-2 text-hub-text text-sm focus:outline-none focus:border-hub-accent font-mono"
                placeholder="sk-ant-api03-..."
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-2 border border-hub-border rounded text-hub-muted hover:text-hub-text text-sm transition-colors"
                title={showKey ? 'Verbergen' : 'Tonen'}
              >
                {showKey ? '🙈' : '👁'}
              </button>
              <button
                onClick={handleSaveKey}
                className="px-3 py-2 bg-hub-accent text-white rounded text-sm hover:bg-opacity-80 transition-colors"
              >
                Opslaan
              </button>
            </div>
            {apiKey && (
              <p className="text-green-400 text-xs mt-1">
                ✓ API-sleutel ingesteld ({apiKey.slice(0, 15)}...)
              </p>
            )}
            <p className="text-hub-muted text-xs mt-1">
              Je sleutel wordt lokaal opgeslagen en nooit gedeeld.
            </p>
          </section>

          {/* Layout presets */}
          <section>
            <h3 className="text-hub-text text-sm font-medium mb-3">
              Layout ({columns}×{rows} — {frames.length} frames)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {LAYOUT_PRESETS.map((preset) => {
                const isActive = preset.columns === columns && preset.rows === rows
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={`p-3 rounded border text-sm transition-colors ${
                      isActive
                        ? 'bg-hub-accent border-hub-accent text-white'
                        : 'border-hub-border text-hub-muted hover:border-hub-accent hover:text-hub-text'
                    }`}
                  >
                    <div className="font-mono text-xs mb-1">{preset.name}</div>
                    <div className="flex gap-0.5 justify-center">
                      {Array.from({ length: preset.columns }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-current rounded-sm opacity-60"
                          style={{ width: 8, height: preset.rows === 1 ? 12 : 6 }}
                        />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Add frame */}
          <section>
            <h3 className="text-hub-text text-sm font-medium mb-3">Frames</h3>
            <button
              onClick={addFrame}
              className="w-full py-2 border border-dashed border-hub-border rounded text-hub-muted hover:border-hub-accent hover:text-hub-text text-sm transition-colors"
            >
              + Frame toevoegen
            </button>
          </section>

          {/* Keyboard shortcuts */}
          <section>
            <h3 className="text-hub-text text-sm font-medium mb-3">Sneltoetsen</h3>
            <div className="space-y-1 text-xs">
              {[
                ['F11', 'Volledig scherm aan/uit'],
                ['Ctrl+,', 'Instellingen openen'],
                ['Ctrl+R', 'Alle frames vernieuwen'],
                ['Escape', 'Modal sluiten']
              ].map(([key, desc]) => (
                <div key={key} className="flex justify-between text-hub-muted">
                  <code className="font-mono text-hub-accent">{key}</code>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
