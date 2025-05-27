
// src/hooks/useChatManager.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChatSession, ChatMessage } from '@/types/ai-chat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const LOCAL_STORAGE_KEY = 'aiChatSessions_v3'; // Incremented version

const generateUniqueId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export function useChatManager(initialLanguage: 'es' | 'en' = 'es', key?: number) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'es' | 'en'>(initialLanguage);
  const [isLoaded, setIsLoaded] = useState(false);

  const getWelcomeMessage = useCallback((language: 'es' | 'en'): ChatMessage => ({
    id: generateUniqueId(`nova-welcome-${language}`),
    type: 'assistant',
    text: language === 'es' 
      ? '¡Hola! Soy Nova 🚀, tu Asistente de Estudio IA en EduConnect. ¿En qué puedo ayudarte hoy en esta nueva sesión?' 
      : "Hi! I'm Nova 🚀, your EduConnect AI Study Assistant. How can I help you today in this new session?",
    timestamp: Date.now(),
    isLoading: false,
    isError: false,
  }), []);

  useEffect(() => {
    let sessionsToLoad: ChatSession[] = [];
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSessions) {
        const parsedSessions: ChatSession[] = JSON.parse(storedSessions);
        if (Array.isArray(parsedSessions) && parsedSessions.every(s => s.id && s.name && Array.isArray(s.messages))) {
          sessionsToLoad = parsedSessions;
        }
      }
    } catch (error) {
      console.error("Error loading chat sessions from localStorage:", error);
    }

    if (sessionsToLoad.length > 0) {
      const sortedSessions = [...sessionsToLoad].sort((a, b) => b.lastActivity - a.lastActivity);
      setChatSessions(sortedSessions);
      setActiveSessionId(sortedSessions[0].id);
    } else {
      const newId = generateUniqueId('chat');
      const now = Date.now();
      const defaultSession: ChatSession = {
        id: newId,
        name: initialLanguage === 'es' ? `Chat 1 - ${format(now, 'p', { locale: es })}` : `Chat 1 - ${format(now, 'p')}`,
        messages: [getWelcomeMessage(initialLanguage)],
        createdAt: now,
        lastActivity: now,
      };
      setChatSessions([defaultSession]);
      setActiveSessionId(newId);
    }
    setIsLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialLanguage, getWelcomeMessage]); // getWelcomeMessage is stable

  useEffect(() => {
    if (isLoaded && chatSessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatSessions));
    } else if (isLoaded && chatSessions.length === 0) {
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear localStorage if all chats are deleted
    }
  }, [chatSessions, isLoaded]);

  const createNewChatSession = useCallback((makeActive = true) => {
    const newSessionId = generateUniqueId('chat');
    const sessionNumber = chatSessions.length + 1;
    const now = Date.now();
    
    const newSession: ChatSession = {
      id: newSessionId,
      name: currentLanguage === 'es' ? `Chat ${sessionNumber} - ${format(now, 'p', { locale: es })}` : `Chat ${sessionNumber} - ${format(now, 'p')}`,
      messages: [getWelcomeMessage(currentLanguage)],
      createdAt: now,
      lastActivity: now,
    };

    setChatSessions(prevSessions => [newSession, ...prevSessions]);

    if (makeActive) {
      setActiveSessionId(newSessionId);
    }
    return newSessionId;
  }, [chatSessions.length, currentLanguage, getWelcomeMessage]);

  const deleteChatSession = useCallback((sessionIdToDelete: string) => {
    setChatSessions(prevSessions => {
      const remainingSessions = prevSessions.filter(session => session.id !== sessionIdToDelete);
      if (activeSessionId === sessionIdToDelete) {
        if (remainingSessions.length > 0) {
          const sortedRemaining = [...remainingSessions].sort((a,b) => b.lastActivity - a.lastActivity);
          setActiveSessionId(sortedRemaining[0].id);
        } else {
          // Create a new one if all are deleted
          const newId = generateUniqueId('chat');
          const now = Date.now();
          const defaultSession: ChatSession = {
            id: newId,
            name: currentLanguage === 'es' ? `Chat 1 - ${format(now, 'p', { locale: es })}` : `Chat 1 - ${format(now, 'p')}`,
            messages: [getWelcomeMessage(currentLanguage)],
            createdAt: now,
            lastActivity: now,
          };
          setActiveSessionId(newId);
          return [defaultSession];
        }
      }
      if (remainingSessions.length === 0 && activeSessionId !== sessionIdToDelete) {
        const newId = generateUniqueId('chat');
        const now = Date.now();
        const defaultSession: ChatSession = {
            id: newId,
            name: currentLanguage === 'es' ? `Chat 1 - ${format(now, 'p', { locale: es })}` : `Chat 1 - ${format(now, 'p')}`,
            messages: [getWelcomeMessage(currentLanguage)],
            createdAt: now,
            lastActivity: now,
          };
        setActiveSessionId(newId);
        return [defaultSession];
      }
      return remainingSessions;
    });
  }, [activeSessionId, currentLanguage, getWelcomeMessage]);


  const addMessageToSession = useCallback((sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateUniqueId(message.type || 'msg'),
      timestamp: Date.now(),
    };

    setChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, newMessage], lastActivity: Date.now() }
          : session
      ).sort((a, b) => b.lastActivity - a.lastActivity)
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
      ).sort((a, b) => b.lastActivity - a.lastActivity)
    );
  }, []);

  const clearAllChats = useCallback(() => {
    setChatSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // createNewChatSession(true); // Re-create one after clearing if needed
  }, []);

  const renameChatSession = useCallback((sessionId: string, newName: string) => {
    setChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId ? { ...session, name: newName, lastActivity: Date.now() } : session
      ).sort((a, b) => b.lastActivity - a.lastActivity)
    );
  }, []);

  const sortedChatSessions = useMemo(() => 
    [...chatSessions].sort((a,b) => b.createdAt - a.createdAt)
  , [chatSessions]);

  const activeChatMessages = useMemo(() => 
    chatSessions.find(s => s.id === activeSessionId)?.messages || []
  , [chatSessions, activeSessionId]);

  return {
    chatSessions: sortedChatSessions,
    activeSessionId,
    activeChatMessages,
    currentLanguage,
    setActiveSessionId: useCallback(setActiveSessionId, []),
    createNewChatSession,
    deleteChatSession,
    addMessageToSession,
    updateMessageInSession,
    setCurrentLanguage: useCallback(setCurrentLanguage, []),
    clearAllChats,
    renameChatSession,
    getWelcomeMessage,
  };
}

