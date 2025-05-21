
// src/components/ai/chat-list.tsx
"use client";

import React, { useState } from 'react';
import type { ChatSession } from '@/types/ai-chat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquareText, Trash2, Edit3, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '../ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ChatListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  currentLanguage: 'es' | 'en';
}

export function ChatList({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewChat,
  onDeleteSession,
  onRenameSession,
  currentLanguage,
}: ChatListProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const T = {
    es: {
      newChat: "Nuevo Chat",
      chat: "Chat",
      deleteChatTitle: "¿Eliminar este chat?",
      deleteChatDescription: "Esta acción no se puede deshacer. Esto eliminará permanentemente la conversación.",
      cancel: "Cancelar",
      delete: "Eliminar",
      rename: "Renombrar",
      confirmRename: "Confirmar Renombre",
      cancelRename: "Cancelar Renombre",
      editNamePlaceholder: "Nuevo nombre del chat...",
    },
    en: {
      newChat: "New Chat",
      chat: "Chat",
      deleteChatTitle: "Delete this chat?",
      deleteChatDescription: "This action cannot be undone. This will permanently delete the conversation.",
      cancel: "Cancel",
      delete: "Delete",
      rename: "Rename",
      confirmRename: "Confirm Rename",
      cancelRename: "Cancel Rename",
      editNamePlaceholder: "New chat name...",
    }
  }[currentLanguage];

  const handleRename = (sessionId: string) => {
    if (editText.trim()) {
      onRenameSession(sessionId, editText.trim());
    }
    setEditingSessionId(null);
    setEditText('');
  };

  const startEdit = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditText(session.name);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full bg-muted/50 border-r border-border">
        <div className="p-3 border-b border-border">
          <Button onClick={onCreateNewChat} className="w-full" variant="default">
            <PlusCircle className="mr-2 h-5 w-5" />
            {T.newChat}
          </Button>
        </div>
        <ScrollArea className="flex-grow">
          <div className="space-y-1 p-2">
            {sessions.map((session) => (
              <div key={session.id} className="group relative">
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-1 p-2 rounded-md bg-background border border-primary shadow-sm">
                    <Input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(session.id)}
                      placeholder={T.editNamePlaceholder}
                      className="h-8 flex-grow text-sm"
                      autoFocus
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRename(session.id)}>
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>{T.confirmRename}</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                       <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingSessionId(null); setEditText(''); }}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>{T.cancelRename}</p></TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <Button
                    variant={activeSessionId === session.id ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start items-center text-sm h-auto py-2 px-3 text-left',
                      activeSessionId === session.id && 'bg-primary/10 text-primary font-semibold'
                    )}
                    onClick={() => onSelectSession(session.id)}
                  >
                    <MessageSquareText className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate flex-grow">{session.name}</span>
                  </Button>
                )}
                {editingSessionId !== session.id && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Tooltip>
                       <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(session)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>{T.rename}</p></TooltipContent>
                    </Tooltip>
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom"><p>{T.delete}</p></TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{T.deleteChatTitle}</AlertDialogTitle>
                          <AlertDialogDescription>{T.deleteChatDescription}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{T.cancel}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteSession(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {T.delete}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
