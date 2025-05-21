
// src/components/ai/ai-assistant-layout.tsx
"use client";

import React, { useEffect } from 'react';
import { ChatList } from './chat-list';
import { ChatView } from './chat-view';
import { useChatManager } from '@/hooks/useChatManager';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; // To get current language

export function AiAssistantLayout() {
  const { userProfile } = useFirebaseAuth(); // Get userProfile for language preference
  const initialLanguage = userProfile?.idioma || 'es'; // Default to 'es' if not set

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
    setCurrentLanguage: setChatManagerLanguage, // Specific setter for chat manager
    renameChatSession,
  } = useChatManager(initialLanguage);

  // Sync chat manager language with app language from userProfile
  useEffect(() => {
    if (userProfile?.idioma && userProfile.idioma !== currentLanguage) {
      setChatManagerLanguage(userProfile.idioma);
    }
  }, [userProfile?.idioma, currentLanguage, setChatManagerLanguage]);

  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem)-2rem)] border border-border rounded-lg shadow-sm overflow-hidden bg-card">
      {/* Header height is approx 4rem (h-16), plus some margin/padding (1rem top, 1rem bottom for parent = 2rem) */}
      <div className="w-64 md:w-72 lg:w-80 flex-shrink-0">
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

// Define --header-height in globals.css or AppLayout if not already standardized
// For example, if your header is h-16 (4rem)
// globals.css:
// :root {
//   --header-height: 4rem;
// }
