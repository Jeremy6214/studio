
// src/components/ai/ai-assistant-layout.tsx
"use client";

import React, { useEffect } from 'react';
import { ChatList } from './chat-list';
import { ChatView } from './chat-view';
import { useChatManager } from '@/hooks/useChatManager';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; 

export function AiAssistantLayout() {
  const { user, userProfile, loading } = useFirebaseAuth(); 
  // Ensure language is determined only after mount to avoid hydration issues with localStorage
  const [initialLanguage, setInitialLanguage] = React.useState<'es' | 'en'>('es');

  useEffect(() => {
    if (!loading) { // Wait for auth state to settle
      const langFromProfile = userProfile?.idioma;
      const langFromStorage = typeof window !== 'undefined' ? localStorage.getItem('language') as 'es' | 'en' : null;
      setInitialLanguage(langFromProfile || langFromStorage || 'es');
    }
  }, [userProfile, loading]);


  const {
    chatSessions,
    activeSessionId,
    activeChatMessages,
    currentLanguage, 
    setActiveSessionId,
    createNewChatSession,
    deleteChatSession,
    addMessageToSession,
    updateMessageInSession,
    setCurrentLanguage: setChatManagerLanguage, 
    renameChatSession,
  } = useChatManager(initialLanguage);

  useEffect(() => {
    if (!loading) {
      const appLanguage = userProfile?.idioma || (typeof window !== 'undefined' && localStorage.getItem('language') as 'es' | 'en') || 'es';
      if (appLanguage !== currentLanguage) {
        setChatManagerLanguage(appLanguage);
      }
    }
  }, [userProfile?.idioma, currentLanguage, setChatManagerLanguage, loading]);

  if (loading) { // Show a loading state for the entire layout if auth is loading
    return (
        <div className="flex h-[calc(100vh-var(--header-height,4rem)-2rem-5rem)] border border-border rounded-lg shadow-sm overflow-hidden bg-card animate-pulse">
            <div className="w-64 md:w-72 lg:w-80 flex-shrink-0 bg-sidebar border-r border-sidebar-border p-4 space-y-3">
                <div className="h-10 bg-muted rounded-md"></div>
                <div className="h-8 bg-muted rounded-md"></div>
                <div className="h-8 bg-muted rounded-md"></div>
                <div className="h-8 bg-muted rounded-md"></div>
            </div>
            <div className="flex-grow border-l border-border p-4 space-y-4">
                <div className="h-16 bg-muted rounded-md self-end w-3/4"></div>
                <div className="h-20 bg-muted/70 rounded-md self-start w-full"></div>
                <div className="h-16 bg-muted rounded-md self-end w-2/3"></div>
                <div className="absolute bottom-4 left-0 right-0 p-4 mt-auto">
                    <div className="h-12 bg-muted rounded-md"></div>
                </div>
            </div>
        </div>
    );
  }


  return (
    // Adjusted height calculation to be more robust within flex container
    <div className="flex h-full border border-border rounded-xl shadow-xl overflow-hidden bg-card techno-glow-primary">
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
      <div className="flex-grow border-l border-border">
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
