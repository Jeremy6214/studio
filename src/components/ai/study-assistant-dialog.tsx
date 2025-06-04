
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, User, Bot, Image as ImageIcon, AlertCircle } from 'lucide-react';
import NextImage from 'next/image';
import { askStudyAssistant, type StudyAssistantInput, type StudyAssistantOutput } from '@/lib/study-assistant-simulation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton'; // Skeleton was not used, but kept in imports
import { Avatar } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text?: string;
  imageUrl?: string;
  imageQuery?: string;
  suggestions?: string[];
  isLoading?: boolean;
}

interface StudyAssistantDialogProps {
  currentLanguage: 'es' | 'en';
  triggerButton?: React.ReactNode;
}

// Helper to generate more unique IDs
const generateUniqueId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};


export function StudyAssistantDialog({ currentLanguage, triggerButton }: StudyAssistantDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getWelcomeMessage = useCallback((lang: 'es' | 'en'): Message => ({
    id: `nova-welcome-${lang}`, // Stable ID using only lang
    type: 'assistant',
    text: lang === 'es' ? '¡Hola! Soy Nova 🚀, tu Asistente de Estudio IA en EduConnect. ¿En qué aventura de aprendizaje nos embarcamos hoy?' : "Hi! I'm Nova 🚀, your EduConnect AI Study Assistant. What learning adventure are we embarking on today?",
  }), []);

  useEffect(() => {
    if (isOpen) {
      const welcomeMsg = getWelcomeMessage(currentLanguage);
      if (messages.length === 0 || messages[0]?.id !== welcomeMsg.id) {
        setMessages([welcomeMsg]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentLanguage, getWelcomeMessage, messages]); // Added messages to dependency array

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (queryOverride?: string) => {
    const currentQuery = (queryOverride || inputValue).trim();
    if (!currentQuery || isResponding) return;

    const userMessage: Message = {
      id: generateUniqueId('user'),
      type: 'user',
      text: currentQuery,
    };
    
    const assistantLoadingMessageId = generateUniqueId('assistant-loading');
    const assistantLoadingMessage: Message = {
      id: assistantLoadingMessageId,
      type: 'assistant',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, assistantLoadingMessage]);
    setInputValue('');
    setIsResponding(true);

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
      const assistantResponse: StudyAssistantOutput = await askStudyAssistant({
        query: currentQuery,
        language: currentLanguage,
        generateImageExplicitly,
      });

      const assistantResponseMessage: Message = {
        id: generateUniqueId('assistant-response'),
        type: 'assistant',
        text: assistantResponse.mainResponse,
        imageUrl: assistantResponse.generatedImageUrl,
        imageQuery: assistantResponse.imageQuerySuggestion,
        suggestions: assistantResponse.followUpSuggestions,
      };
      
      setMessages(prev => {
        const newMessages = prev.filter(m => m.id !== assistantLoadingMessageId); // Remove loading message by its specific ID
        return [...newMessages, assistantResponseMessage];
      });

    } catch (error: any) {
      console.error('Error calling study assistant:', error);
      const errorMessageText = error.message || (currentLanguage === 'es' ? 'Nova tuvo un problema al procesar tu solicitud.' : 'Nova had an issue processing your request.');
      
      toast({
        variant: 'destructive',
        title: currentLanguage === 'es' ? 'Error del Asistente Nova' : 'Nova Assistant Error',
        description: errorMessageText,
      });
      setMessages(prev => {
        const newMessages = prev.filter(m => m.id !== assistantLoadingMessageId); // Remove loading message by its specific ID
        return [...newMessages, {
          id: generateUniqueId('error'),
          type: 'assistant',
          text: errorMessageText,
        }];
      });
    } finally {
      setIsResponding(false);
      inputRef.current?.focus();
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion); // Set input value for potential edit
    handleSendMessage(suggestion); // Send suggestion directly
  };

  const defaultTrigger = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="outline"
                size="icon"
                className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary-foreground/50"
                onClick={() => setIsOpen(true)}
                aria-label={currentLanguage === 'es' ? "Abrir Asistente IA Nova" : "Open AI Assistant Nova"}
              >
                <Sparkles className="h-8 w-8" />
              </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
          <p>{currentLanguage === 'es' ? "Chatea con Nova ✨" : "Chat with Nova ✨"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      {triggerButton ? <div onClick={() => setIsOpen(true)}>{triggerButton}</div> : defaultTrigger}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl h-[calc(100vh-4rem)] md:h-[80vh] flex flex-col p-0 bg-card border-border">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg text-primary-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              {currentLanguage === 'es' ? 'Asistente IA Nova' : 'AI Assistant Nova'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {currentLanguage === 'es' ? 'Pregúntale a Nova. ¡Está aquí para ayudarte a aprender! 🚀' : 'Ask Nova. Here to help you learn! 🚀'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow p-4 overflow-y-auto" ref={scrollAreaRef}>
            <div className="space-y-4 mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id} 
                  className={`flex items-start gap-2.5 ${
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.type === 'assistant' && (
                     <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5" />
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm ${
                      msg.type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-muted-foreground rounded-bl-none'
                    }`}
                  >
                    {msg.isLoading ? (
                       <div className="flex items-center space-x-2 p-2">
                          <div className="h-2.5 w-2.5 bg-foreground/30 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                          <div className="h-2.5 w-2.5 bg-foreground/30 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                          <div className="h-2.5 w-2.5 bg-foreground/30 rounded-full animate-pulse"></div>
                       </div>
                    ) : (
                      <>
                        {msg.text && <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></p>}
                        {msg.imageUrl && (
                           <div className="mt-2 p-1 bg-background/50 rounded-md">
                             <NextImage
                               src={msg.imageUrl}
                               alt={msg.imageQuery || (currentLanguage === 'es' ? "Imagen generada por Nova" : "Image generated by Nova")}
                               width={300}
                               height={200}
                               className="rounded-md object-contain max-h-[300px] w-auto"
                               data-ai-hint={msg.imageQuery || "abstract illustration"}
                               unoptimized // Important for static export
                             />
                           </div>
                        )}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-muted-foreground/20 space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground/80">
                              {currentLanguage === 'es' ? 'Nova sugiere:' : 'Nova suggests:'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {msg.suggestions.map((sugg, index) => (
                                <Button
                                    key={`${msg.id}-sugg-${index}`} 
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-auto py-1 px-2 border-primary/50 text-primary hover:bg-primary/10"
                                    onClick={() => handleSuggestionClick(sugg)}
                                >
                                    {sugg}
                                </Button>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {msg.type === 'user' && (
                    <Avatar className="h-8 w-8 bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                      <User className="h-5 w-5" />
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex w-full items-center gap-2"
            >
              <Textarea
                ref={inputRef}
                placeholder={currentLanguage === 'es' ? 'Escribe tu pregunta para Nova...' : 'Type your question for Nova...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isResponding) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                className="min-h-[40px] max-h-[120px] flex-grow resize-none bg-input border-input pr-10"
                disabled={isResponding}
              />
              <Button type="submit" size="icon" disabled={isResponding || !inputValue.trim()} aria-label={currentLanguage === 'es' ? 'Enviar mensaje a Nova' : 'Send message to Nova'}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </DialogFooter>
          <DialogClose asChild>
            <button className="sr-only">Cerrar</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
