
"use client";

import React, { useState, useRef, useEffect } from 'react';
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
import { Sparkles, Send, User, Bot, CornerDownLeft, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { askStudyAssistant, type StudyAssistantInput, type StudyAssistantOutput } from '@/ai/flows/study-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Avatar } from '@/components/ui/avatar'; // Added Avatar import

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text?: string;
  imageUrl?: string;
  suggestions?: string[];
  isLoading?: boolean;
}

interface StudyAssistantDialogProps {
  currentLanguage: 'es' | 'en';
  triggerButton?: React.ReactNode; // Optional custom trigger
}

export function StudyAssistantDialog({ currentLanguage, triggerButton }: StudyAssistantDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const assistantWelcomeMessage: Message = {
    id: 'welcome-' + Date.now(),
    type: 'assistant',
    text: currentLanguage === 'es' ? '¡Hola! Soy tu Asistente de Estudio IA de DarkAIschool. ¿En qué puedo ayudarte hoy?' : 'Hi! I_m your DarkAIschool AI Study Assistant. How can I help you today?',
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([assistantWelcomeMessage]);
    }
  }, [isOpen, currentLanguage, messages.length, assistantWelcomeMessage]); // Added messages.length and assistantWelcomeMessage to dependencies


  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (query?: string) => {
    const currentQuery = (query || inputValue).trim();
    if (!currentQuery) return;

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

    try {
      const assistantResponse: StudyAssistantOutput = await askStudyAssistant({
        query: currentQuery,
        language: currentLanguage,
      });

      const assistantResponseMessage: Message = {
        id: 'assistant-' + Date.now(),
        type: 'assistant',
        text: assistantResponse.mainResponse,
        imageUrl: assistantResponse.generatedImageUrl,
        suggestions: assistantResponse.followUpSuggestions,
      };
      setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantResponseMessage));

    } catch (error) {
      console.error('Error calling study assistant:', error);
      toast({
        variant: 'destructive',
        title: currentLanguage === 'es' ? 'Error de IA' : 'AI Error',
        description: currentLanguage === 'es' ? 'Hubo un problema al contactar al asistente. Inténtalo de nuevo.' : 'There was an issue contacting the assistant. Please try again.',
      });
      setMessages(prev => prev.filter(m => !m.isLoading).concat({
        id: 'error-' + Date.now(),
        type: 'assistant',
        text: currentLanguage === 'es' ? 'Lo siento, no pude procesar tu solicitud en este momento.' : 'Sorry, I couldn_t process your request right now.',
      }));
    } finally {
      setIsResponding(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion); // Pre-fill input
    handleSendMessage(suggestion); // Send message
  };


  const defaultTrigger = (
    <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setIsOpen(true)}
        aria-label={currentLanguage === 'es' ? "Abrir Asistente de Estudio IA" : "Open AI Study Assistant"}
      >
        <Sparkles className="h-7 w-7" />
      </Button>
  );

  return (
    <>
      {triggerButton ? <div onClick={() => setIsOpen(true)}>{triggerButton}</div> : defaultTrigger}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              {currentLanguage === 'es' ? 'Asistente de Estudio IA - DarkAIschool' : 'AI Study Assistant - DarkAIschool'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {currentLanguage === 'es' ? 'Pide ayuda, explicaciones, ideas para estudiar, ¡y más!' : 'Ask for help, explanations, study ideas, and more!'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow p-4 overflow-y-auto" ref={scrollAreaRef}>
            <div className="space-y-4 mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.type === 'assistant' && (
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
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
                       <div className="flex items-center space-x-2">
                         <Skeleton className="h-4 w-4 rounded-full bg-muted-foreground/30" />
                         <Skeleton className="h-3 w-[50px] bg-muted-foreground/30" />
                         <Skeleton className="h-3 w-[30px] bg-muted-foreground/30" />
                       </div>
                    ) : (
                      <>
                        {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        {msg.imageUrl && (
                           <div className="mt-2 p-1 bg-background/50 rounded-md">
                             <Image
                               src={msg.imageUrl}
                               alt={currentLanguage === 'es' ? "Imagen generada por IA" : "AI generated image"}
                               width={300}
                               height={300}
                               className="rounded-md object-contain max-h-[300px] w-auto"
                               data-ai-hint="diagram illustration" // Generic hint
                             />
                           </div>
                        )}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-muted-foreground/20 space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground/80">
                              {currentLanguage === 'es' ? 'Sugerencias:' : 'Suggestions:'}
                            </p>
                            {msg.suggestions.map((sugg, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-xs h-auto py-1 px-2 mr-1.5 mb-1.5 border-primary/50 text-primary hover:bg-primary/10"
                                onClick={() => handleSuggestionClick(sugg)}
                              >
                                {sugg}
                              </Button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {msg.type === 'user' && (
                    <Avatar className="h-8 w-8 bg-secondary text-secondary-foreground flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex w-full items-center gap-2"
            >
              <Textarea
                placeholder={currentLanguage === 'es' ? 'Escribe tu pregunta o solicitud aquí...' : 'Type your question or request here...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
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
