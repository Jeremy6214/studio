
// src/components/ai/ai-assistant-layout.tsx
"use client";

import React, { useEffect } from 'react';
import { ChatList } from './chat-list';
import { ChatView } from './chat-view';
import { useChatManager } from '@/hooks/useChatManager';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; 

export function AiAssistantLayout() {
  const { userProfile } = useFirebaseAuth(); 
  const initialLanguage = userProfile?.idioma || (typeof window !== 'undefined' && localStorage.getItem('language') as 'es' | 'en') || 'es';

  const {
    chatSessions,
    activeSessionId,
    activeChatMessages,
    currentLanguage, // Language from chat manager
    setActiveSessionId,
    createNewChatSession,
    deleteChatSession,
    addMessageToSession,
    updateMessageInSession,
    setCurrentLanguage: setChatManagerLanguage, 
    renameChatSession,
  } = useChatManager(initialLanguage);

  // Sync chat manager language with app language from userProfile
  useEffect(() => {
    const appLanguage = userProfile?.idioma || (typeof window !== 'undefined' && localStorage.getItem('language') as 'es' | 'en') || 'es';
    if (appLanguage !== currentLanguage) {
      setChatManagerLanguage(appLanguage);
    }
  }, [userProfile?.idioma, currentLanguage, setChatManagerLanguage]);

  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem)-2rem)] border border-border rounded-lg shadow-sm overflow-hidden bg-card">
      <div className="w-64 md:w-72 lg:w-80 flex-shrink-0 bg-sidebar border-r border-sidebar-border">
        <ChatList
          sessions={chatSessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onCreateNewChat={() => createNewChatSession(true)}
          onDeleteSession={deleteChatSession}
          onRenameSession={renameChatSession}
          currentLanguage={currentLanguage}
        />
      </div>
      <div className="flex-grow border-l border-border"> {/* Use main content border for separation */}
        <ChatView
          messages={activeChatMessages}
          activeSessionId={activeSessionId}
          onSendMessage={addMessageToSession}
          onUpdateMessage={updateMessageInSession}
          currentLanguage={currentLanguage}
        />
      </div>
    </div>
  );
}
