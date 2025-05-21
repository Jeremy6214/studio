
// src/hooks/useChatManager.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, ChatMessage } from '@/types/ai-chat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const LOCAL_STORAGE_KEY = 'aiChatSessions';

const getWelcomeMessage = (language: 'es' | 'en'): ChatMessage => ({
  id: `nova-welcome-${Date.now()}`,
  type: 'assistant',
  text: language === 'es' 
    ? '¡Hola! Soy Nova 🚀, tu Asistente de Estudio IA en DarkAIschool. ¿En qué aventura de aprendizaje nos embarcamos hoy en esta nueva sesión?' 
    : "Hi! I'm Nova 🚀, your DarkAIschool AI Study Assistant. What learning adventure are we embarking on today in this new session?",
  timestamp: Date.now(),
});

export function useChatManager(initialLanguage: 'es' | 'en' = 'es') {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'es' | 'en'>(initialLanguage);

  // Load sessions from localStorage on initial mount
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSessions) {
        const parsedSessions: ChatSession[] = JSON.parse(storedSessions);
        if (parsedSessions.length > 0) {
          setChatSessions(parsedSessions);
          // Try to set active to the most recent, or the first one
          const sortedSessions = [...parsedSessions].sort((a, b) => b.lastActivity - a.lastActivity);
          setActiveSessionId(sortedSessions[0].id);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading chat sessions from localStorage:", error);
    }
    // If no stored sessions, create a default one
    createNewChatSession(true); // Create a new session and make it active
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: run only once on mount

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) { // Only save if there are sessions, to avoid saving empty array on initial load before hydration
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  const createNewChatSession = useCallback((makeActive = true) => {
    const newSessionId = `chat-${Date.now()}`;
    const sessionNumber = chatSessions.length + 1;
    const now = Date.now();
    
    const newSession: ChatSession = {
      id: newSessionId,
      name: currentLanguage === 'es' ? `Chat ${sessionNumber} - ${format(now, 'HH:mm')}` : `Chat ${sessionNumber} - ${format(now, 'HH:mm')}`,
      messages: [getWelcomeMessage(currentLanguage)],
      createdAt: now,
      lastActivity: now,
    };

    setChatSessions(prevSessions => {
      const updatedSessions = [newSession, ...prevSessions]; // Add new session to the beginning
      return updatedSessions;
    });

    if (makeActive) {
      setActiveSessionId(newSessionId);
    }
    return newSessionId;
  }, [chatSessions.length, currentLanguage]);

  const deleteChatSession = useCallback((sessionIdToDelete: string) => {
    setChatSessions(prevSessions => {
      const remainingSessions = prevSessions.filter(session => session.id !== sessionIdToDelete);
      if (activeSessionId === sessionIdToDelete) {
        if (remainingSessions.length > 0) {
          // Set active to the most recent of the remaining sessions
          const sortedRemaining = [...remainingSessions].sort((a,b) => b.lastActivity - a.lastActivity);
          setActiveSessionId(sortedRemaining[0].id);
        } else {
          // If no sessions left, create a new default one
          const newDefaultId = createNewChatSession(true); // This will also set it active
          return chatSessions.find(s => s.id === newDefaultId) ? [chatSessions.find(s => s.id === newDefaultId)!] : []; // This part is tricky with state updates
        }
      }
      if (remainingSessions.length === 0) {
         // This case should be handled by the logic above that creates a new default if list becomes empty
         // But as a fallback, ensure we create a new session if it results in an empty list.
         // setTimeout is a bit of a hack to ensure state update completes.
         setTimeout(() => {
             if (chatSessions.filter(s => s.id !== sessionIdToDelete).length === 0) {
                 createNewChatSession(true);
             }
         },0);
      }
      return remainingSessions;
    });
  }, [activeSessionId, createNewChatSession, chatSessions]);


  const addMessageToSession = useCallback((sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${message.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    setChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, newMessage], lastActivity: Date.now() }
          : session
      )
    );
    return newMessage.id;
  }, []);
  
  const updateMessageInSession = useCallback((sessionId: string, messageId: string, updates: Partial<ChatMessage>) => {
    setChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId
          ? {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === messageId ? { ...msg, ...updates, isLoading: false } : msg
              ),
              lastActivity: Date.now(),
            }
          : session
      )
    );
  }, []);

  const clearAllChats = useCallback(() => {
    setChatSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // Create a new default session after clearing
    createNewChatSession(true);
  }, [createNewChatSession]);

  const renameChatSession = useCallback((sessionId: string, newName: string) => {
    setChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId ? { ...session, name: newName, lastActivity: Date.now() } : session
      )
    );
  }, []);


  const activeChatMessages = chatSessions.find(s => s.id === activeSessionId)?.messages || [];

  return {
    chatSessions: [...chatSessions].sort((a,b) => b.createdAt - a.createdAt), // Display sorted by creation time, newest first
    activeSessionId,
    activeChatMessages,
    currentLanguage,
    setActiveSessionId,
    createNewChatSession,
    deleteChatSession,
    addMessageToSession,
    updateMessageInSession,
    setCurrentLanguage, // Expose to sync with AppLayout language
    clearAllChats,
    renameChatSession,
    getWelcomeMessage,
  };
}
