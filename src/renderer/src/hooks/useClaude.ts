import { useEffect, useRef, useCallback } from 'react'
import { useLayoutStore } from '../store/layout'
import { useChatStore } from '../store/chat'

export function useClaude() {
  const { apiKey } = useLayoutStore()
  const { messages, addMessage, setLoading, setActiveTools, isLoading } = useChatStore()
  const cleanupRef = useRef<(() => void) | null>(null)

  // Setup tool-executing event listener
  useEffect(() => {
    if (!window.electronAPI) return

    const cleanup = window.electronAPI.onToolExecuting(({ tool, input }) => {
      setActiveTools([tool])
      // Auto-clear after 3s
      setTimeout(() => setActiveTools([]), 3000)
    })

    cleanupRef.current = cleanup
    return () => cleanup()
  }, [setActiveTools])

  const sendMessage = useCallback(
    async (userText: string): Promise<void> => {
      if (!userText.trim() || isLoading) return

      if (!apiKey) {
        addMessage({
          role: 'system',
          content:
            '⚠ Stel eerst je Claude API-sleutel in via het ⚙-icoon rechtsboven.',
        })
        return
      }

      // Add user message to store
      addMessage({ role: 'user', content: userText })
      setLoading(true)

      // Build message history for Claude (exclude system messages)
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      // Add the new user message
      history.push({ role: 'user', content: userText })

      try {
        const result = await window.electronAPI.claudeChat(history, apiKey)

        addMessage({
          role: 'assistant',
          content: result.response,
          toolsUsed: result.toolsUsed
        })
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        addMessage({
          role: 'system',
          content: `❌ Fout bij contact met Claude: ${errorMsg}`
        })
      } finally {
        setLoading(false)
        setActiveTools([])
      }
    },
    [apiKey, messages, addMessage, setLoading, setActiveTools, isLoading]
  )

  return { sendMessage, isLoading }
}
