
// src/components/ai/chat-view.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ChatMessage } from '@/types/ai-chat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, UserRound, Bot, AlertTriangle, MessageSquareDashed, MessageSquareText } from 'lucide-react';
import NextImage from 'next/image';
import { askStudyAssistant, type StudyAssistantInput, type StudyAssistantOutput } from '@/ai/flows/study-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatViewProps {
  messages: ChatMessage[];
  activeSessionId: string | null;
  onSendMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  onUpdateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  currentLanguage: 'es' | 'en';
  userDisplayName: string;
  getWelcomeMessage: (language: 'es' | 'en') => ChatMessage;
}

const ChatMessageDisplay = React.memo(function ChatMessageDisplayComponent({
  msg,
  userDisplayName,
  T,
  currentLanguage,
  onSuggestionClick,
}: {
  msg: ChatMessage;
  userDisplayName: string;
  T: any; // Translation object
  currentLanguage: 'es' | 'en';
  onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <div
      className={cn('flex items-end gap-2.5', msg.type === 'user' ? 'justify-end' : 'justify-start')}
    >
      {msg.type === 'assistant' && (
        <Avatar className="h-9 w-9 bg-primary text-primary-foreground flex items-center justify-center shrink-0 rounded-lg shadow-md techno-glow-primary self-start">
          <Bot className="h-5 w-5" />
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] md:max-w-[70%] rounded-xl px-4 py-3 shadow-md transition-all duration-200 ease-in-out',
          msg.type === 'user'
            ? 'bg-primary text-primary-foreground rounded-br-none ml-auto'
            : msg.isError
              ? 'bg-destructive/20 text-destructive-foreground border border-destructive rounded-bl-none'
              : 'bg-muted text-foreground rounded-bl-none'
        )}
      >
        <p className="text-xs font-semibold mb-1 opacity-80">
          {msg.type === 'user' ? userDisplayName : T.nova}
        </p>
        {msg.isLoading ? (
          <div className="flex items-center space-x-1.5 p-1 typing-dots">
            <span></span><span></span><span></span>
          </div>
        ) : (
          <>
            {msg.isError && <AlertTriangle className="inline-block h-5 w-5 mr-2 text-destructive" />}
            {msg.text && <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></p>}
            {msg.imageUrl && (
              <div className="mt-2.5 p-1.5 bg-background/30 rounded-lg border border-border/50">
                <NextImage
                  src={msg.imageUrl}
                  alt={msg.imageQuery || T.imageAlt}
                  width={300}
                  height={200}
                  className="rounded-md object-contain max-h-[350px] w-auto shadow-sm"
                  data-ai-hint={msg.imageQuery || "abstract ai illustration"}
                  priority={false}
                  unoptimized // Important for static export
                />
              </div>
            )}
            {msg.suggestions && msg.suggestions.length > 0 && !msg.isError && (
              <div className="mt-3 pt-2.5 border-t border-current/20 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {msg.suggestions.map((sugg, index) => (
                    <Button
                      key={`${msg.id}-sugg-${index}`}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1.5 px-2.5 border-primary/70 text-primary hover:bg-primary/10 hover:text-primary hover:scale-105 transition-transform duration-150 rounded-md shadow-sm"
                      onClick={() => onSuggestionClick(sugg)}
                    >
                      {sugg}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
          <p className="text-xs text-current/60 mt-1.5 text-right">
          {format(new Date(msg.timestamp), 'p', { locale: currentLanguage === 'es' ? es : undefined })}
        </p>
      </div>
      {msg.type === 'user' && (
        <Avatar className="h-9 w-9 bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 rounded-lg shadow-md techno-glow-secondary self-start">
            <UserRound className="h-5 w-5" />
        </Avatar>
      )}
    </div>
  );
});
ChatMessageDisplay.displayName = 'ChatMessageDisplay';

export function ChatView({
  messages,
  activeSessionId,
  onSendMessage,
  onUpdateMessage,
  currentLanguage,
  userDisplayName,
  getWelcomeMessage
}: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const T = useMemo(() => ({
    es: {
      inputPlaceholder: "Pregúntale a Nova...",
      sendMessage: "Enviar a Nova",
      assistantErrorTitle: "Error de Nova",
      assistantErrorMessage: "Nova tuvo un problema al procesar tu solicitud.",
      imageAlt: "Visualización generada por Nova",
      suggestionsTitle: "Nova sugiere:",
      loadingNova: "Nova está pensando...",
      noActiveChat: "Selecciona o crea un chat para comenzar.",
      noMessages: "Comienza la conversación con Nova.",
      user: "Tú",
      nova: "Nova (Simulado)", // Indicate simulation if AI calls are not real
    },
    en: {
      inputPlaceholder: "Ask Nova...",
      sendMessage: "Send to Nova",
      assistantErrorTitle: "Nova Error",
      assistantErrorMessage: "Nova had an issue processing your request.",
      imageAlt: "Visualization generated by Nova",
      suggestionsTitle: "Nova suggests:",
      loadingNova: "Nova is thinking...",
      noActiveChat: "Select or create a chat to start.",
      noMessages: "Start the conversation with Nova.",
      user: "You",
      nova: "Nova (Simulated)", // Indicate simulation
    }
  }[currentLanguage]), [currentLanguage]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages, activeSessionId]);

  useEffect(() => {
    if(activeSessionId) {
      inputRef.current?.focus();
    }
  }, [activeSessionId]);

  const handleSendMessage = useCallback(async (queryOverride?: string) => {
    if (!activeSessionId) return;
    const currentQuery = (queryOverride || inputValue).trim();
    if (!currentQuery || isResponding) return;

    const userMessageId = onSendMessage(activeSessionId, { type: 'user', text: currentQuery });
    setInputValue(''); 
    setIsResponding(true);

    const assistantLoadingMessageId = onSendMessage(activeSessionId, { type: 'assistant', isLoading: true });

    const lowerQuery = currentQuery.toLowerCase();
    const generateImageExplicitly =
      lowerQuery.includes("imagen") ||
      lowerQuery.includes("dibuja") ||
      lowerQuery.includes("diagrama") ||
      lowerQuery.includes("mapa") ||
      lowerQuery.includes("visual") ||
      lowerQuery.includes("picture") ||
      lowerQuery.includes("draw") ||
      lowerQuery.includes("diagram") ||
      lowerQuery.includes("map");

    try {
      const assistantInput: StudyAssistantInput = {
        query: currentQuery,
        language: currentLanguage,
        generateImageExplicitly,
      };
      // askStudyAssistant is now a client-side function
      const assistantResponse: StudyAssistantOutput = await askStudyAssistant(assistantInput);

      onUpdateMessage(activeSessionId, assistantLoadingMessageId, {
        text: assistantResponse.mainResponse,
        imageUrl: assistantResponse.generatedImageUrl,
        imageQuery: assistantResponse.imageQuerySuggestion,
        suggestions: assistantResponse.followUpSuggestions,
        isLoading: false,
        isError: assistantResponse.isError,
      });

    } catch (error: any) {
      console.error('Error calling study assistant:', error);
      const errorMessageText = error.message || T.assistantErrorMessage;
      toast({
        variant: 'destructive',
        title: T.assistantErrorTitle,
        description: errorMessageText,
      });
      onUpdateMessage(activeSessionId, assistantLoadingMessageId, {
        text: errorMessageText,
        isLoading: false,
        isError: true,
      });
    } finally {
      setIsResponding(false);
      inputRef.current?.focus();
    }
  }, [activeSessionId, inputValue, isResponding, onSendMessage, currentLanguage, onUpdateMessage, toast, T]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  const displayedMessages = useMemo(() => {
    if (!activeSessionId) return [];
    if (messages.length === 0) {
        return [getWelcomeMessage(currentLanguage)];
    }
    return messages;
  }, [messages, activeSessionId, currentLanguage, getWelcomeMessage]);


  if (!activeSessionId) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center bg-card">
        <MessageSquareDashed className="h-20 w-20 text-primary opacity-30 mb-6 techno-glow-primary" />
        <p className="text-xl font-semibold text-foreground mb-2">{T.noActiveChat}</p>
        <p className="text-md text-muted-foreground">
          {currentLanguage === 'es' ? 'Usa el panel de la izquierda para empezar una nueva conversación o seleccionar una existente.' : 'Use the panel on the left to start a new conversation or select an existing one.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-5 mb-4">
          {displayedMessages.length === 0 && activeSessionId && (
             <div className="text-center py-10 text-muted-foreground">
                <MessageSquareDashed className="mx-auto h-12 w-12 opacity-50 mb-3 text-primary" />
                <p className="text-sm">{T.noMessages}</p>
              </div>
          )}
          {displayedMessages.map((msg) => (
            <ChatMessageDisplay
              key={msg.id}
              msg={msg}
              userDisplayName={userDisplayName}
              T={T}
              currentLanguage={currentLanguage}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="p-3 md:p-4 border-t border-border bg-background/80 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex w-full items-end gap-2"
        >
          <Textarea
            ref={inputRef}
            placeholder={T.inputPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isResponding && inputValue.trim()) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={1}
            className="min-h-[48px] max-h-[150px] flex-grow resize-none bg-input border-input pr-12 text-sm rounded-lg shadow-sm focus:techno-glow-primary focus:border-primary"
            disabled={isResponding}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isResponding || !inputValue.trim()}
            aria-label={T.sendMessage}
            className="h-12 w-12 rounded-lg shadow-md hover:scale-105 hover:brightness-125 transition-transform techno-glow-primary"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
