import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useChatStore } from '../../store/chat'
import { useClaude } from '../../hooks/useClaude'
import { useLayoutStore } from '../../store/layout'

const TOOL_LABELS: Record<string, string> = {
  read_frame_content: 'Inhoud lezen',
  type_in_frame: 'Tekst typen',
  click_in_frame: 'Klikken',
  send_message_to_app: 'Bericht sturen',
  navigate_frame: 'Navigeren',
  screenshot_frame: 'Screenshot maken',
  execute_js_in_frame: 'Script uitvoeren'
}

export function ChatBox(): JSX.Element {
  const { messages, isLoading, activeTools, clearMessages } = useChatStore()
  const { sendMessage } = useClaude()
  const { frames } = useLayoutStore()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, activeTools])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  const handleSend = useCallback(async (): Promise<void> => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage(text)
  }, [input, isLoading, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Suggestion chips based on current frames
  const suggestions = [
    `Lees de inhoud van ${frames[0]?.id || 'frame-0'}`,
    `Stuur "Leg Python uit" naar ${frames[0]?.id || 'frame-0'}`,
    `Maak een screenshot van alle frames`
  ]

  return (
    <div className="chatbox flex flex-col h-full bg-hub-surface border-t border-hub-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-hub-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-hub-accent font-semibold text-xs">✦ Claude AI</span>
          <span className="text-hub-muted text-xs">— bedien je frames via tekst</span>
        </div>
        <button
          onClick={clearMessages}
          className="text-hub-muted hover:text-hub-text text-xs transition-colors"
          title="Geschiedenis wissen"
        >
          Wissen
        </button>
      </div>

      {/* Messages scroll area */}
      <div
        ref={scrollRef}
        className="chat-scroll flex-1 overflow-y-auto px-3 py-2 space-y-2"
        style={{ minHeight: 0 }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            {msg.role === 'user' && (
              <div className="flex justify-end">
                <div className="bg-hub-accent text-white rounded-lg rounded-br-sm px-3 py-2 text-sm max-w-[80%]">
                  {msg.content}
                </div>
              </div>
            )}

            {msg.role === 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-hub-bg border border-hub-border rounded-lg rounded-bl-sm px-3 py-2 text-sm max-w-[90%] text-hub-text">
                  <MessageContent content={msg.content} />
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.toolsUsed.map((tool, i) => (
                        <span
                          key={i}
                          className="text-xs px-1.5 py-0.5 bg-hub-surface rounded text-hub-muted border border-hub-border"
                        >
                          ⚡ {TOOL_LABELS[tool] || tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {msg.role === 'system' && (
              <div className="text-hub-muted text-xs text-center py-1 px-2 bg-hub-bg rounded border border-hub-border">
                <MessageContent content={msg.content} />
              </div>
            )}
          </div>
        ))}

        {/* Active tool indicator */}
        {activeTools.length > 0 && (
          <div className="flex items-center gap-2 text-hub-muted text-xs py-1">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-hub-accent animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span>{TOOL_LABELS[activeTools[0]] || activeTools[0]}...</span>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && activeTools.length === 0 && (
          <div className="flex items-center gap-2 text-hub-muted text-xs py-1">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-hub-accent animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span>Claude denkt na...</span>
          </div>
        )}
      </div>

      {/* Suggestion chips (only when no conversation yet) */}
      {messages.length <= 1 && (
        <div className="px-3 pb-1 flex flex-wrap gap-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInput(s)}
              className="text-xs px-2 py-1 bg-hub-bg border border-hub-border rounded text-hub-muted hover:border-hub-accent hover:text-hub-text transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 px-3 pb-3 pt-2 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Stuur een opdracht naar je apps... (Enter = verzenden, Shift+Enter = nieuwe regel)"
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-hub-bg border border-hub-border rounded-lg px-3 py-2 text-hub-text text-sm resize-none focus:outline-none focus:border-hub-accent placeholder-hub-muted disabled:opacity-50 transition-colors"
          style={{ minHeight: '36px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-hub-accent text-white rounded-lg hover:bg-opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Verzenden (Enter)"
        >
          {isLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// Renders message content with basic markdown-like formatting
function MessageContent({ content }: { content: string }): JSX.Element {
  const lines = content.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-1">
              <span className="text-hub-accent flex-shrink-0">•</span>
              <span>{line.slice(2)}</span>
            </div>
          )
        }
        return (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        )
      })}
    </>
  )
}
