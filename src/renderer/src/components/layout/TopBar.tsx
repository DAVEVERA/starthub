import React, { useState, useCallback } from 'react'
import { useLayoutStore, LAYOUT_PRESETS } from '../../store/layout'
import { SettingsPanel } from '../config/SettingsPanel'

export function TopBar(): JSX.Element {
  const { frames, addFrame, columns, rows, applyPreset, apiKey } = useLayoutStore()
  const [showSettings, setShowSettings] = useState(false)

  const handleFullscreen = useCallback((): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen().catch(console.error)
    }
  }, [])

  return (
    <>
      <div className="top-bar flex items-center gap-3 px-3 py-2 bg-hub-bg border-b border-hub-border flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded bg-hub-accent flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
          <span className="text-hub-text font-semibold text-sm">StartHub</span>
        </div>

        <div className="w-px h-4 bg-hub-border" />

        {/* Layout presets quick toggle */}
        <div className="flex items-center gap-1">
          {LAYOUT_PRESETS.slice(0, 4).map((preset) => {
            const isActive = preset.columns === columns && preset.rows === rows
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  isActive
                    ? 'bg-hub-accent text-white'
                    : 'text-hub-muted hover:text-hub-text hover:bg-hub-surface'
                }`}
                title={`${preset.name} layout`}
              >
                {preset.name}
              </button>
            )
          })}
        </div>

        <div className="w-px h-4 bg-hub-border" />

        {/* Frame count indicator */}
        <span className="text-hub-muted text-xs">
          {frames.length} frame{frames.length !== 1 ? 's' : ''}
        </span>

        <button
          onClick={addFrame}
          className="text-hub-muted hover:text-hub-text text-xs px-2 py-1 rounded hover:bg-hub-surface transition-colors"
          title="Frame toevoegen"
        >
          + Frame
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* API key status */}
        {apiKey ? (
          <span className="text-green-400 text-xs">✓ Claude</span>
        ) : (
          <span className="text-yellow-400 text-xs">⚠ Geen API-sleutel</span>
        )}

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="text-hub-muted hover:text-hub-text text-sm transition-colors px-1"
          title="Volledig scherm (F11)"
        >
          ⛶
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="text-hub-muted hover:text-hub-text text-sm transition-colors px-1"
          title="Instellingen"
        >
          ⚙
        </button>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  )
}
