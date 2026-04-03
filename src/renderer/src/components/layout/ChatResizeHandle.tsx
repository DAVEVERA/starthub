import React, { useCallback, useRef } from 'react'
import { useLayoutStore } from '../../store/layout'

export function ChatResizeHandle(): JSX.Element {
  const { chatHeight, setChatHeight } = useLayoutStore()
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault()
      isDragging.current = true
      startY.current = e.clientY
      startHeight.current = chatHeight

      const onMouseMove = (ev: MouseEvent): void => {
        if (!isDragging.current) return
        const delta = startY.current - ev.clientY // drag up = taller
        const newHeight = startHeight.current + delta
        setChatHeight(newHeight)
      }

      const onMouseUp = (): void => {
        isDragging.current = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
      }

      document.body.style.cursor = 'row-resize'
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [chatHeight, setChatHeight]
  )

  return (
    <div
      className="resize-handle resize-handle-v h-1.5 w-full cursor-row-resize flex items-center justify-center group flex-shrink-0"
      onMouseDown={onMouseDown}
      title="Sleep om chatbox te vergroten/verkleinen"
    >
      <div className="w-8 h-0.5 rounded bg-hub-border group-hover:bg-hub-accent transition-colors" />
    </div>
  )
}
