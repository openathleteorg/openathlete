import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatbotPosition {
  x: number; // Percentage
  y: number; // Percentage
}

interface ChatbotContextType {
  // Chat window state
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;

  // Bubble position
  bubblePosition: ChatbotPosition;
  setBubblePosition: (position: ChatbotPosition) => void;

  // Chat window width
  chatWidth: number;
  setChatWidth: (width: number) => void;

  // Chat window side (left or right)
  chatSide: 'left' | 'right';
  setChatSide: (side: 'left' | 'right') => void;

  // Active thread (API-based)
  activeThreadId: number | null;
  setActiveThreadId: (id: number | null) => void;

  // Legacy: Conversations (for backward compatibility with old components)
  conversations: ChatConversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  addMessage: (
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
  ) => void;
  getActiveConversation: () => ChatConversation | null;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BUBBLE_POSITION: 'chatbot-bubble-position',
  CHAT_WIDTH: 'chatbot-chat-width',
  CHAT_SIDE: 'chatbot-chat-side',
  ACTIVE_THREAD_ID: 'chatbot-active-thread-id',
  // Legacy keys for backward compatibility
  CONVERSATIONS: 'chatbot-conversations',
  ACTIVE_CONVERSATION_ID: 'chatbot-active-conversation-id',
};

const DEFAULT_BUBBLE_POSITION: ChatbotPosition = { x: 100, y: 100 }; // Bottom right (snapped)
const DEFAULT_CHAT_WIDTH = 450;
const DEFAULT_CHAT_SIDE: 'left' | 'right' = 'left';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const [bubblePosition, setBubblePositionState] = useState<ChatbotPosition>(
    () => {
      const stored = localStorage.getItem(STORAGE_KEYS.BUBBLE_POSITION);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return DEFAULT_BUBBLE_POSITION;
        }
      }
      return DEFAULT_BUBBLE_POSITION;
    },
  );

  const [chatWidth, setChatWidthState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_WIDTH);
    return stored ? parseInt(stored, 10) : DEFAULT_CHAT_WIDTH;
  });

  const [chatSide, setChatSideState] = useState<'left' | 'right'>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SIDE);
    return stored === 'right' ? 'right' : DEFAULT_CHAT_SIDE;
  });

  // Active thread ID (for real API)
  const [activeThreadId, setActiveThreadIdState] = useState<number | null>(
    () => {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_THREAD_ID);
      return stored ? parseInt(stored, 10) : null;
    },
  );

  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert string dates to Date objects
        return parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeConversationId, setActiveConversationIdState] = useState<
    string | null
  >(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID) || null;
  });

  const setBubblePosition = useCallback((position: ChatbotPosition) => {
    setBubblePositionState(position);
    localStorage.setItem(
      STORAGE_KEYS.BUBBLE_POSITION,
      JSON.stringify(position),
    );
  }, []);

  const setChatWidth = useCallback((width: number) => {
    setChatWidthState(width);
    localStorage.setItem(STORAGE_KEYS.CHAT_WIDTH, width.toString());
  }, []);

  const setChatSide = useCallback((side: 'left' | 'right') => {
    setChatSideState(side);
    localStorage.setItem(STORAGE_KEYS.CHAT_SIDE, side);
  }, []);

  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    }
  }, []);

  const setActiveThreadId = useCallback((id: number | null) => {
    setActiveThreadIdState(id);
    if (id !== null) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_THREAD_ID, id.toString());
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_THREAD_ID);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.CONVERSATIONS,
      JSON.stringify(conversations),
    );
  }, [conversations]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const createConversation = useCallback(
    (title?: string): string => {
      const id = generateId();
      const now = new Date();
      const newConversation: ChatConversation = {
        id,
        title: title || `Conversation ${conversations.length + 1}`,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      setConversations((prev) => [...prev, newConversation]);
      setActiveConversationId(id);
      return id;
    },
    [conversations.length, setActiveConversationId],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((conv) => conv.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [activeConversationId, conversations, setActiveConversationId],
  );

  const addMessage = useCallback(
    (
      conversationId: string,
      message: Omit<ChatMessage, 'id' | 'timestamp'>,
    ) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            const newMessage: ChatMessage = {
              ...message,
              id: generateId(),
              timestamp: new Date(),
            };
            return {
              ...conv,
              messages: [...conv.messages, newMessage],
              updatedAt: new Date(),
            };
          }
          return conv;
        }),
      );
    },
    [],
  );

  const getActiveConversation = useCallback((): ChatConversation | null => {
    if (!activeConversationId) return null;
    return (
      conversations.find((conv) => conv.id === activeConversationId) || null
    );
  }, [activeConversationId, conversations]);

  const value: ChatbotContextType = {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    bubblePosition,
    setBubblePosition,
    chatWidth,
    setChatWidth,
    chatSide,
    setChatSide,
    activeThreadId,
    setActiveThreadId,
    // Legacy support
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    addMessage,
    getActiveConversation,
  };

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}
