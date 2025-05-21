
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
import { askStudyAssistant, type StudyAssistantInput, type StudyAssistantOutput } from '@/ai/flows/study-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Avatar } from '@/components/ui/avatar';

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

export function StudyAssistantDialog({ currentLanguage, triggerButton }: StudyAssistantDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getWelcomeMessage = useCallback((lang: 'es' | 'en'): Message => ({
    id: 'welcome-' + Date.now(),
    type: 'assistant',
    text: lang === 'es' ? '¡Hola! Soy tu Asistente de Estudio IA de DarkAIschool (Simulado Avanzado). ¿En qué puedo ayudarte hoy?' : 'Hi! I_m your DarkAIschool AI Study Assistant (Advanced Simulated). How can I help you today?',
  }), []);

  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        setMessages([getWelcomeMessage(currentLanguage)]);
      }
      // Short delay to ensure dialog is fully rendered before focusing
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentLanguage, messages.length, getWelcomeMessage]);


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
      id: 'user-' + Date.now(),
      type: 'user',
      text: currentQuery,
    };
    
    const assistantLoadingMessage: Message = {
      id: 'assistant-loading-' + Date.now(),
      type: 'assistant',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, assistantLoadingMessage]);
    setInputValue('');
    setIsResponding(true);

    const lowerQuery = currentQuery.toLowerCase();
    const generateImageExplicitly = lowerQuery.includes("imagen") ||
                                  lowerQuery.includes("picture") ||
                                  lowerQuery.includes("diagrama") ||
                                  lowerQuery.includes("diagram") ||
                                  lowerQuery.includes("mapa") ||
                                  lowerQuery.includes("map") ||
                                  lowerQuery.includes("visual") ||
                                  lowerQuery.includes("dibuja") || 
                                  lowerQuery.includes("draw");

    try {
      // askStudyAssistant is now locally defined and might be synchronous or return a resolved promise
      const assistantResponse: StudyAssistantOutput = await askStudyAssistant({
        query: currentQuery,
        language: currentLanguage,
        generateImageExplicitly,
      });

      const assistantResponseMessage: Message = {
        id: 'assistant-' + Date.now(),
        type: 'assistant',
        text: assistantResponse.mainResponse,
        imageUrl: assistantResponse.generatedImageUrl,
        imageQuery: assistantResponse.imageGenerationQuery,
        suggestions: assistantResponse.followUpSuggestions,
      };
      setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantResponseMessage));

    } catch (error: any) {
      console.error('Error calling study assistant:', error);
      const errorMessageText = error.message || (currentLanguage === 'es' ? 'Hubo un problema al procesar tu solicitud (simulada).' : 'There was an issue processing your request (simulated).');
      
      toast({
        variant: 'destructive',
        title: currentLanguage === 'es' ? 'Error del Asistente' : 'Assistant Error',
        description: errorMessageText,
      });
      setMessages(prev => prev.filter(m => !m.isLoading).concat({
        id: 'error-' + Date.now(),
        type: 'assistant',
        text: errorMessageText,
      }));
    } finally {
      setIsResponding(false);
      inputRef.current?.focus();
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const defaultTrigger = (
    <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setIsOpen(true)}
        aria-label={currentLanguage === 'es' ? "Abrir Asistente de Estudio IA (Simulado)" : "Open AI Study Assistant (Simulated)"}
      >
        <Sparkles className="h-7 w-7" />
      </Button>
  );

  return (
    <>
      {triggerButton ? <div onClick={() => setIsOpen(true)}>{triggerButton}</div> : defaultTrigger}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl h-[calc(100vh-4rem)] md:h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg text-primary-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              {currentLanguage === 'es' ? 'Asistente de Estudio IA (Simulado)' : 'AI Study Assistant (Simulated)'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {currentLanguage === 'es' ? 'Pide ayuda, explicaciones, ideas para estudiar, ¡y más! (Respuestas simuladas)' : 'Ask for help, explanations, study ideas, and more! (Simulated responses)'}
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
                    className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                      msg.type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-muted-foreground rounded-bl-none'
                    }`}
                  >
                    {msg.isLoading ? (
                       <div className="flex items-center space-x-1.5 p-1">
                         <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                         <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                         <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                       </div>
                    ) : (
                      <>
                        {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        {msg.imageUrl && (
                           <div className="mt-2 p-1 bg-background/50 rounded-md">
                             <NextImage
                               src={msg.imageUrl}
                               alt={msg.imageQuery || (currentLanguage === 'es' ? "Imagen simulada por IA" : "AI simulated image")}
                               width={300}
                               height={200}
                               className="rounded-md object-contain max-h-[300px] w-auto"
                               data-ai-hint={msg.imageQuery || "abstract illustration"}
                             />
                           </div>
                        )}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-muted-foreground/20 space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground/80">
                              {currentLanguage === 'es' ? 'Sugerencias:' : 'Suggestions:'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {msg.suggestions.map((sugg, index) => (
                                <Button
                                    key={index}
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
                placeholder={currentLanguage === 'es' ? 'Escribe tu pregunta aquí...' : 'Type your question here...'}
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
              <Button type="submit" size="icon" disabled={isResponding || !inputValue.trim()} aria-label={currentLanguage === 'es' ? 'Enviar mensaje' : 'Send message'}>
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
