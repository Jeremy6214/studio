
// src/components/ai/chat-list.tsx
"use client";

import React, { useState, useCallback, useMemo } from 'react';
import type { ChatSession } from '@/types/ai-chat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquarePlus, MessageSquareText, Trash2, Edit3, Check, X, BotMessageSquare } from 'lucide-react'; // Corrected: MessagePlus to MessageSquarePlus
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

const ChatListItem = React.memo(function ChatListItemComponent({
  session,
  isActive,
  onSelect,
  onStartEdit,
  onDelete,
  isEditing,
  editText,
  onEditTextChange,
  onConfirmRename,
  onCancelRename,
  T,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: (sessionId: string) => void;
  onStartEdit: (session: ChatSession) => void;
  onDelete: (sessionId: string) => void;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (text: string) => void;
  onConfirmRename: (sessionId: string) => void;
  onCancelRename: () => void;
  T: any; // Translation object
}) {
  return (
    <div className="group relative rounded-lg">
      {isEditing ? (
        <div className="flex items-center gap-1 p-2 rounded-lg bg-background border border-primary shadow-md">
          <Input
            type="text"
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirmRename(session.id)}
            placeholder={T.editNamePlaceholder}
            className="h-9 flex-grow text-sm bg-input border-input text-foreground focus:techno-glow-primary"
            autoFocus
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-full" onClick={() => onConfirmRename(session.id)}>
                <Check className="h-4 w-4 text-green-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border"><p>{T.confirmRename}</p></TooltipContent>
          </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-full" onClick={onCancelRename}>
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border"><p>{T.cancelRename}</p></TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <Button
          variant={'ghost'}
          className={cn(
            'w-full justify-start items-center text-sm h-auto py-2.5 px-3 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all duration-150 ease-in-out',
            isActive && 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold techno-glow-primary shadow-inner'
          )}
          onClick={() => onSelect(session.id)}
        >
          <MessageSquareText className="mr-2.5 h-4 w-4 flex-shrink-0" />
          <span className="truncate flex-grow">{session.name}</span>
        </Button>
      )}
      {!isEditing && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Tooltip>
              <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-full" onClick={() => onStartEdit(session)}>
                <Edit3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border"><p>{T.rename}</p></TooltipContent>
          </Tooltip>
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border"><p>{T.delete}</p></TooltipContent>
            </Tooltip>
            <AlertDialogContent className="bg-card border-border shadow-xl techno-glow-destructive">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground text-xl">{T.deleteChatTitle}</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">{T.deleteChatDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="hover:scale-105 transition-transform">{T.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(session.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 transition-transform"
                >
                  {T.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
});
ChatListItem.displayName = 'ChatListItem';


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

  const T = useMemo(() => ({
    es: {
      newChat: "Nuevo Chat",
      noChats: "Inicia tu primer chat con Nova.",
      deleteChatTitle: "¿Eliminar esta conversación?",
      deleteChatDescription: "Esta acción no se puede deshacer. Esto eliminará permanentemente la conversación con Nova.",
      cancel: "Cancelar",
      delete: "Eliminar",
      rename: "Renombrar Chat",
      confirmRename: "Confirmar Nombre",
      cancelRename: "Cancelar",
      editNamePlaceholder: "Nuevo nombre del chat...",
    },
    en: {
      newChat: "New Chat",
      noChats: "Start your first chat with Nova.",
      deleteChatTitle: "Delete this conversation?",
      deleteChatDescription: "This action cannot be undone. This will permanently delete the conversation with Nova.",
      cancel: "Cancel",
      delete: "Delete",
      rename: "Rename Chat",
      confirmRename: "Confirm Rename",
      cancelRename: "Cancel",
      editNamePlaceholder: "New chat name...",
    }
  }[currentLanguage]), [currentLanguage]);

  const handleConfirmRename = useCallback((sessionId: string) => {
    if (editText.trim()) {
      onRenameSession(sessionId, editText.trim());
    }
    setEditingSessionId(null);
    setEditText('');
  }, [editText, onRenameSession]);

  const handleStartEdit = useCallback((session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditText(session.name);
  }, []);

  const handleCancelRename = useCallback(() => {
    setEditingSessionId(null);
    setEditText('');
  }, []);

  const sortedSessions = useMemo(() => 
    [...sessions].sort((a, b) => b.createdAt - a.createdAt)
  , [sessions]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-col h-full text-sidebar-foreground bg-sidebar">
        <div className="p-3 border-b border-sidebar-border">
          <Button
            onClick={onCreateNewChat}
            className="w-full hover:scale-105 hover:brightness-125 transition-transform duration-200 techno-glow-primary shadow-md"
            variant="default"
          >
            <MessageSquarePlus className="mr-2 h-5 w-5" /> {/* Corrected: MessagePlus to MessageSquarePlus */}
            {T.newChat}
          </Button>
        </div>
        <ScrollArea className="flex-grow">
          <div className="space-y-1 p-2">
            {sortedSessions.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <BotMessageSquare className="mx-auto h-12 w-12 opacity-50 mb-3 text-primary" />
                <p className="text-sm">{T.noChats}</p>
              </div>
            )}
            {sortedSessions.map((session) => (
              <ChatListItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                onSelect={onSelectSession}
                onStartEdit={handleStartEdit}
                onDelete={onDeleteSession}
                isEditing={editingSessionId === session.id}
                editText={editText}
                onEditTextChange={setEditText}
                onConfirmRename={handleConfirmRename}
                onCancelRename={handleCancelRename}
                T={T}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
