
// src/components/ai/ai-assistant-layout.tsx
"use client";

import React, { useEffect, useMemo } from 'react';
import { ChatList } from './chat-list';
import { ChatView } from './chat-view';
import { useChatManager } from '@/hooks/useChatManager';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth'; 
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export function AiAssistantLayout() {
  const { user, userProfile, authLoading, userProfileLoading, currentLanguage: appLanguage } = useFirebaseAuth(); 
  const [initialChatLanguage, setInitialChatLanguage] = React.useState<'es' | 'en'>(appLanguage);
  const [managerKey, setManagerKey] = React.useState(Date.now());

  // Hydration guard - MOVED UP
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // This effect runs once on mount OR if loading state changes from true to false,
    // or if appLanguage (from Firebase auth/profile) changes
    if (!authLoading && !userProfileLoading) { 
      const determinedLang = appLanguage || (typeof window !== 'undefined' ? localStorage.getItem('language') as 'es' | 'en' : null) || 'es';
      if (determinedLang !== initialChatLanguage) {
        setInitialChatLanguage(determinedLang);
        setManagerKey(Date.now()); // Force re-mount of useChatManager if language changes
      }
    }
  }, [appLanguage, authLoading, userProfileLoading, initialChatLanguage]);


  const {
    chatSessions,
    activeSessionId,
    activeChatMessages,
    currentLanguage: chatManagerLanguage, 
    setActiveSessionId,
    createNewChatSession,
    deleteChatSession,
    addMessageToSession,
    updateMessageInSession,
    setCurrentLanguage: setChatManagerLanguage, 
    renameChatSession,
    getWelcomeMessage, // Expose for direct use if needed
  } = useChatManager(initialChatLanguage, managerKey);

  // Effect to sync app language to chat manager language if they diverge
  useEffect(() => {
    if (!authLoading && !userProfileLoading && hasMounted) {
      if (appLanguage !== chatManagerLanguage) {
        setChatManagerLanguage(appLanguage);
      }
    }
  }, [appLanguage, chatManagerLanguage, setChatManagerLanguage, authLoading, userProfileLoading, hasMounted]);


  const userDisplayName = useMemo(() => {
    if (userProfile?.nombre) return userProfile.nombre;
    if (user?.displayName) return user.displayName;
    return appLanguage === 'es' ? "Estudiante" : "Student";
  }, [userProfile?.nombre, user?.displayName, appLanguage]);


  if (!hasMounted || authLoading || userProfileLoading) { 
    return (
        <div className="flex h-[calc(100vh-var(--header-height,4rem)-2rem-5rem)] border border-border rounded-lg shadow-sm overflow-hidden bg-card">
            <div className="w-64 md:w-72 lg:w-80 flex-shrink-0 bg-sidebar border-r border-sidebar-border p-4 space-y-3">
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-8 rounded-md" />
                <Skeleton className="h-8 rounded-md" />
                <Skeleton className="h-8 rounded-md" />
            </div>
            <div className="flex-grow border-l border-border p-4 space-y-4 relative">
                <Skeleton className="h-16 rounded-md self-end w-3/4 ml-auto" />
                <Skeleton className="h-20 rounded-md self-start w-full" />
                <Skeleton className="h-16 rounded-md self-end w-2/3 ml-auto" />
                <div className="absolute bottom-4 left-4 right-4 mt-auto">
                    <Skeleton className="h-12 rounded-md" />
                </div>
            </div>
        </div>
    );
  }


  return (
    <div className="flex h-full border border-border rounded-xl shadow-xl overflow-hidden bg-card techno-glow-primary">
      <div className="w-64 md:w-72 lg:w-80 flex-shrink-0 bg-sidebar border-r border-sidebar-border">
        <ChatList
          sessions={chatSessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onCreateNewChat={() => createNewChatSession(true)}
          onDeleteSession={deleteChatSession}
          onRenameSession={renameChatSession}
          currentLanguage={chatManagerLanguage}
        />
      </div>
      <div className="flex-grow border-l border-border">
        <ChatView
          messages={activeChatMessages}
          activeSessionId={activeSessionId}
          onSendMessage={addMessageToSession}
          onUpdateMessage={updateMessageInSession}
          currentLanguage={chatManagerLanguage}
          userDisplayName={userDisplayName}
          getWelcomeMessage={getWelcomeMessage}
        />
      </div>
    </div>
  );
}

