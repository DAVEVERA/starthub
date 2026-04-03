import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolsUsed?: string[]
  timestamp: number
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  activeTools: string[]

  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setActiveTools: (tools: string[]) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: 'welcome',
      role: 'system',
      content:
        'Welkom bij StartHub! Stel je Claude API-sleutel in via het tandwiel-icoon en begin dan met het besturen van je apps via de chatbox. Voorbeelden:\n• "Stuur \'Hallo\' naar ChatGPT in frame 1"\n• "Lees de inhoud van frame 2"\n• "Navigeer frame 3 naar github.com"',
      timestamp: Date.now()
    }
  ],
  isLoading: false,
  activeTools: [],

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: `msg-${Date.now()}-${Math.random()}`, timestamp: Date.now() }
      ]
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setActiveTools: (tools) => set({ activeTools: tools }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: 'clear',
          role: 'system',
          content: 'Chatgeschiedenis gewist.',
          timestamp: Date.now()
        }
      ]
    })
}))
