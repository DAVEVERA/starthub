import React, { useCallback, useRef, useState } from 'react'
import { useLayoutStore, type FrameConfig } from '../../store/layout'
import { FramePanel } from './FramePanel'
import { FrameConfigModal } from '../config/FrameConfigModal'

interface ResizeState {
  active: boolean
  index: number
  startX: number
  startY: number
  direction: 'h' | 'v'
}

export function GridLayout(): JSX.Element {
  const { frames, columns, rows } = useLayoutStore()
  const [configuringFrame, setConfiguringFrame] = useState<FrameConfig | null>(null)
  const { removeFrame } = useLayoutStore()
  const resizeRef = useRef<ResizeState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Build rows of frames based on the columns setting
  const frameRows: FrameConfig[][] = []
  for (let r = 0; r < rows; r++) {
    const row: FrameConfig[] = []
    for (let c = 0; c < columns; c++) {
      const idx = r * columns + c
      if (idx < frames.length) row.push(frames[idx])
    }
    if (row.length > 0) frameRows.push(row)
  }

  // Handle horizontal splitter drag between frames in a row
  const onSplitterMouseDown = useCallback(
    (e: React.MouseEvent, rowIndex: number, colIndex: number): void => {
      e.preventDefault()
      resizeRef.current = {
        active: true,
        index: rowIndex * columns + colIndex,
        startX: e.clientX,
        startY: e.clientY,
        direction: 'h'
      }

      const onMouseMove = (ev: MouseEvent): void => {
        if (!resizeRef.current?.active) return
        // Simple delta-based resize — we update flexGrow of adjacent frames
        // This is a simplified version; a full implementation would track initial sizes
      }

      const onMouseUp = (): void => {
        resizeRef.current = null
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [columns]
  )

  return (
    <>
      <div
        ref={containerRef}
        className="grid-layout flex flex-col h-full gap-1 p-1"
        style={{ background: '#0f1117' }}
      >
        {frameRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="frame-row flex flex-1 gap-1"
            style={{ minHeight: 0 }}
          >
            {row.map((frame, colIndex) => (
              <React.Fragment key={frame.id}>
                {/* Frame panel */}
                <div
                  className="frame-cell"
                  style={{
                    flex: frame.flexGrow,
                    minWidth: 0,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <FramePanel
                    frame={frame}
                    onConfigure={setConfiguringFrame}
                    onRemove={removeFrame}
                  />
                </div>

                {/* Horizontal resize handle between columns */}
                {colIndex < row.length - 1 && (
                  <div
                    className="resize-handle w-1 rounded cursor-col-resize"
                    onMouseDown={(e) => onSplitterMouseDown(e, rowIndex, colIndex)}
                    title="Sleep om formaat aan te passen"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        ))}

        {/* Empty state */}
        {frames.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-hub-muted flex-col gap-3">
            <div className="text-4xl">⊞</div>
            <div className="text-sm">Geen frames. Voeg frames toe via de configuratie.</div>
          </div>
        )}
      </div>

      {/* Frame config modal */}
      {configuringFrame && (
        <FrameConfigModal
          frame={configuringFrame}
          onClose={() => setConfiguringFrame(null)}
        />
      )}
    </>
  )
}
