import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { FrameConfig } from '../../store/layout'

interface FramePanelProps {
  frame: FrameConfig
  onConfigure: (frame: FrameConfig) => void
  onRemove: (id: string) => void
}

export function FramePanel({ frame, onConfigure, onRemove }: FramePanelProps): JSX.Element {
  const webviewRef = useRef<Electron.WebviewTag | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [title, setTitle] = useState(frame.label)
  const [error, setError] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const partition = `persist:${frame.id}`

  // Setup webview and register with main process
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return

    // Setup X-Frame-Options bypass for this partition
    window.electronAPI.setupPartition(partition).catch(console.error)

    const onDomReady = async (): Promise<void> => {
      setIsLoading(false)
      setError(null)
      // Register with main process IPC handler
      try {
        // @ts-ignore — getWebContentsId is an Electron webview method
        const wcId: number = wv.getWebContentsId()
        await window.electronAPI.registerFrame(frame.id, wcId)
      } catch (err) {
        console.error('Failed to register frame:', err)
      }
    }

    const onLoadStart = (): void => {
      setIsLoading(true)
      setError(null)
    }

    const onLoadStop = (): void => {
      setIsLoading(false)
    }

    const onTitleUpdate = (e: Event): void => {
      const event = e as CustomEvent<{ title: string }>
      if (event.detail?.title) setTitle(event.detail.title)
    }

    const onDidFailLoad = (e: Event): void => {
      const event = e as CustomEvent<{ errorDescription: string; errorCode: number }>
      if (event.detail?.errorCode !== -3) {
        // -3 is ERR_ABORTED (navigation cancelled), ignore
        setError(`Laden mislukt: ${event.detail?.errorDescription || 'Onbekende fout'}`)
        setIsLoading(false)
      }
    }

    wv.addEventListener('dom-ready', onDomReady)
    wv.addEventListener('did-start-loading', onLoadStart)
    wv.addEventListener('did-stop-loading', onLoadStop)
    wv.addEventListener('page-title-updated', onTitleUpdate)
    wv.addEventListener('did-fail-load', onDidFailLoad)

    return () => {
      wv.removeEventListener('dom-ready', onDomReady)
      wv.removeEventListener('did-start-loading', onLoadStart)
      wv.removeEventListener('did-stop-loading', onLoadStop)
      wv.removeEventListener('page-title-updated', onTitleUpdate)
      wv.removeEventListener('did-fail-load', onDidFailLoad)
      // Unregister on unmount
      window.electronAPI.unregisterFrame(frame.id).catch(console.error)
    }
  }, [frame.id, partition])

  // Reload when URL changes
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    const currentSrc = wv.getAttribute('src')
    if (currentSrc !== frame.url) {
      setIsLoading(true)
      wv.setAttribute('src', frame.url)
    }
  }, [frame.url])

  const handleReload = useCallback((): void => {
    webviewRef.current?.reload()
  }, [])

  const handleBack = useCallback((): void => {
    webviewRef.current?.goBack()
  }, [])

  return (
    <div
      className="frame-panel flex flex-col h-full relative bg-hub-surface border border-hub-border rounded overflow-hidden"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Frame header bar */}
      <div className="frame-header flex items-center gap-1 px-2 py-1 bg-hub-bg border-b border-hub-border flex-shrink-0 min-h-[32px]">
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            className="text-hub-muted hover:text-hub-text transition-colors text-xs px-1"
            title="Terug"
          >
            ←
          </button>
          <button
            onClick={handleReload}
            className="text-hub-muted hover:text-hub-text transition-colors text-xs px-1"
            title="Vernieuwen"
          >
            ↺
          </button>
        </div>

        <span className="text-hub-muted text-xs flex-1 truncate select-none" title={title}>
          {frame.label} {title !== frame.label ? `— ${title}` : ''}
        </span>

        {isLoading && (
          <div className="w-3 h-3 rounded-full border-2 border-hub-accent border-t-transparent animate-spin flex-shrink-0" />
        )}

        {/* Config/remove buttons on hover */}
        <div
          className={`flex items-center gap-1 transition-opacity ${showOverlay ? 'opacity-100' : 'opacity-0'}`}
        >
          <button
            onClick={() => onConfigure(frame)}
            className="text-hub-muted hover:text-hub-text text-xs px-1 transition-colors"
            title="Frame instellen"
          >
            ⚙
          </button>
          <button
            onClick={() => onRemove(frame.id)}
            className="text-hub-muted hover:text-red-400 text-xs px-1 transition-colors"
            title="Frame verwijderen"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-4 text-center">
          <div className="text-red-400 text-sm">{error}</div>
          <button
            onClick={handleReload}
            className="px-3 py-1 bg-hub-accent text-white text-xs rounded hover:bg-opacity-80 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {/* Webview */}
      {!error && (
        <div className="flex-1 relative overflow-hidden">
          {/* Loading skeleton */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-hub-bg z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-hub-accent border-t-transparent animate-spin" />
                <span className="text-hub-muted text-xs">{frame.url}</span>
              </div>
            </div>
          )}
          {/* The actual webview — using dangerouslySetInnerHTML trick to keep the webview alive */}
          <webview
            ref={webviewRef as React.RefObject<HTMLElement>}
            src={frame.url}
            partition={partition}
            allowpopups="true"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex'
            }}
          />
        </div>
      )}
    </div>
  )
}
