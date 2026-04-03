import React, { useEffect } from 'react'
import { TopBar } from './components/layout/TopBar'
import { GridLayout } from './components/layout/GridLayout'
import { ChatBox } from './components/chatbox/ChatBox'
import { ChatResizeHandle } from './components/layout/ChatResizeHandle'
import { useLayoutStore } from './store/layout'

export default function App(): JSX.Element {
  const { chatHeight } = useLayoutStore()

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // F11 = fullscreen
      if (e.key === 'F11') {
        e.preventDefault()
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(console.error)
        } else {
          document.exitFullscreen().catch(console.error)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      className="app-root flex flex-col"
      style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}
    >
      {/* Top toolbar */}
      <TopBar />

      {/* Main content area — grows to fill remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
        {/* Webview grid */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <GridLayout />
        </div>

        {/* Resize handle between grid and chatbox */}
        <ChatResizeHandle />

        {/* Claude AI Chatbox — fixed height, user-resizable */}
        <div
          className="flex-shrink-0"
          style={{ height: chatHeight, minHeight: 120, maxHeight: 600 }}
        >
          <ChatBox />
        </div>
      </div>
    </div>
  )
}
