import React, { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar/Sidebar'
import Main from './components/Main/Main'

const CHAT_STORAGE_KEY = 'domain-gpt-chat-sessions'
const ACTIVE_CHAT_STORAGE_KEY = 'domain-gpt-active-chat-id'

const createChatSession = () => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title: 'New Chat',
  messages: [],
  updatedAt: Date.now(),
})

const initialChatSession = createChatSession()

const isValidChatSession = (chat) => (
  chat
  && typeof chat.id === 'string'
  && typeof chat.title === 'string'
  && Array.isArray(chat.messages)
)

const normalizeChatSession = (chat) => ({
  id: chat.id,
  title: chat.title || 'New Chat',
  messages: chat.messages
    .filter((message) => message && typeof message.role === 'string' && typeof message.text === 'string')
    .map((message) => ({ role: message.role, text: message.text })),
  updatedAt: typeof chat.updatedAt === 'number' ? chat.updatedAt : Date.now(),
})

const getStoredChatSessions = () => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isValidChatSession).map(normalizeChatSession)
  } catch {
    return []
  }
}

const getInitialChatState = () => {
  const storedSessions = getStoredChatSessions()

  if (!storedSessions.length) {
    return {
      sessions: [initialChatSession],
      activeChatId: initialChatSession.id,
    }
  }

  let storedActiveChatId = ''
  if (typeof window !== 'undefined') {
    storedActiveChatId = window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY) || ''
  }

  const resolvedActiveChatId = storedSessions.some((chat) => chat.id === storedActiveChatId)
    ? storedActiveChatId
    : storedSessions[0].id

  return {
    sessions: storedSessions,
    activeChatId: resolvedActiveChatId,
  }
}

const getChatTitleFromPrompt = (prompt) => {
  const normalized = prompt.trim().replace(/\s+/g, ' ')
  if (normalized.length <= 38) return normalized
  return `${normalized.slice(0, 35)}...`
}

const isCompactScreen = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 1024
}

const App = () => {
  const initialChatState = useMemo(() => getInitialChatState(), [])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [chatSessions, setChatSessions] = useState(initialChatState.sessions)
  const [activeChatId, setActiveChatId] = useState(initialChatState.activeChatId)

  const activeChat = chatSessions.find((chat) => chat.id === activeChatId) || chatSessions[0]
  const activeMessages = activeChat?.messages || []

  const handleCreateNewChat = () => {
    const newChat = createChatSession()
    setChatSessions((prev) => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setIsMobileMenuOpen(false)
  }

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId)
    setIsMobileMenuOpen(false)
  }

  const handleDeleteChat = (chatId) => {
    setChatSessions((prev) => {
      const remaining = prev.filter((chat) => chat.id !== chatId)

      if (remaining.length === 0) {
        const fallbackChat = createChatSession()
        setActiveChatId(fallbackChat.id)
        return [fallbackChat]
      }

      if (chatId === activeChatId) {
        setActiveChatId(remaining[0].id)
      }

      return remaining
    })
  }

  const handleAddMessageToChat = (chatId, message) => {
    setChatSessions((prev) => {
      const chatToUpdate = prev.find((chat) => chat.id === chatId)
      if (!chatToUpdate) return prev

      const updatedChat = {
        ...chatToUpdate,
        messages: [...chatToUpdate.messages, message],
        updatedAt: Date.now(),
      }

      return [updatedChat, ...prev.filter((chat) => chat.id !== chatId)]
    })
  }

  const handleSetChatTitleFromPrompt = (chatId, prompt) => {
    setChatSessions((prev) => {
      const chatToUpdate = prev.find((chat) => chat.id === chatId)
      if (!chatToUpdate || chatToUpdate.title !== 'New Chat') return prev

      const updatedChat = {
        ...chatToUpdate,
        title: getChatTitleFromPrompt(prompt),
        updatedAt: Date.now(),
      }

      return [updatedChat, ...prev.filter((chat) => chat.id !== chatId)]
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatSessions))
    } catch {
      // Ignore storage quota and privacy-mode errors.
    }
  }, [chatSessions])

  useEffect(() => {
    if (typeof window === 'undefined' || !activeChatId) return

    try {
      window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeChatId)
    } catch {
      // Ignore storage quota and privacy-mode errors.
    }
  }, [activeChatId])

  const handleMainClick = () => {
    if (!isCompactScreen() && isSidebarExpanded) {
      setIsSidebarExpanded(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isExpanded={isSidebarExpanded}
        onToggleExpanded={() => setIsSidebarExpanded((prev) => !prev)}
        recentChats={chatSessions}
        activeChatId={activeChat?.id}
        onNewChat={handleCreateNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />
      <Main
        onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
        onMainClick={handleMainClick}
        activeChatId={activeChat?.id}
        messages={activeMessages}
        onAddMessageToChat={handleAddMessageToChat}
        onSetChatTitleFromPrompt={handleSetChatTitleFromPrompt}
      />
      <div
        className={`app-overlay ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
    </div>
  )
}

export default App