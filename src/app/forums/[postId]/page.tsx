
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label'; // Added missing import
import { Input } from '@/components/ui/input'; // Added missing import
import { ArrowLeft, ThumbsUp, Send, MessageSquare, Edit2, Trash2, Heart, CornerDownRight, GripVertical, WifiOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { ForumPost, ForumComment } from '@/types/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent as EditDialogContent, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle, DialogFooter as EditDialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as DeleteDialogContent,
  AlertDialogDescription as DeleteDialogDescription,
  AlertDialogFooter as DeleteDialogFooter,
  AlertDialogHeader as DeleteDialogHeader,
  AlertDialogTitle as DeleteDialogTitle,
  AlertDialogTrigger as DeleteDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, runTransaction, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

const EditCommentDialog = React.memo(function EditCommentDialogComponent({
  comment,
  open,
  onOpenChange,
  onSave,
  currentLanguage
}: {
  comment: ForumComment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (commentId: string, newContent: string) => Promise<void>;
  currentLanguage: 'es' | 'en';
}) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const T = useMemo(() => ({
    es: {
      title: "Editar Comentario",
      errorEmpty: "El contenido no puede estar vacío.",
      cancel: "Cancelar",
      save: "Guardar Cambios",
      saving: "Guardando...",
    },
    en: {
      title: "Edit Comment",
      errorEmpty: "Content cannot be empty.",
      cancel: "Cancel",
      save: "Save Changes",
      saving: "Saving...",
    }
  })[currentLanguage], [currentLanguage]);

  useEffect(() => {
    if (comment) {
      setContent(comment.contenido);
    }
  }, [comment]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || !content.trim()) {
      toast({ title: "Error", description: T.errorEmpty, variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await onSave(comment.id, content);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }, [comment, content, onSave, onOpenChange, toast, T]);

  if (!comment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditDialogContent className="sm:max-w-lg bg-card border-border shadow-xl techno-glow-primary">
        <EditDialogHeader>
          <EditDialogTitle className="text-primary text-xl">{T.title}</EditDialogTitle>
        </EditDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="bg-input border-input focus:techno-glow-primary min-h-[100px]"
            disabled={isSaving}
            required
          />
          <EditDialogFooter className="pt-2">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>{T.cancel}</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || !content.trim()} className="hover:scale-105 hover:brightness-125 transition-transform">
              {isSaving ? T.saving : T.save}
            </Button>
          </EditDialogFooter>
        </form>
      </EditDialogContent>
    </Dialog>
  );
});
EditCommentDialog.displayName = 'EditCommentDialog';

const CommentCard = React.memo(function CommentCardComponent({
  comment,
  onReply,
  onLikeComment,
  onThankComment,
  onEditComment,
  onDeleteComment,
  nestingLevel = 0,
  currentUserId,
  currentUserIsAdmin,
  currentLanguage
}: {
  comment: ForumComment;
  onReply: (commentId: string, authorName: string) => void;
  onLikeComment: (commentId: string) => void;
  onThankComment: (commentId: string) => void;
  onEditComment: (comment: ForumComment) => void;
  onDeleteComment: (commentId: string, parentPostId: string) => void;
  nestingLevel?: number;
  currentUserId: string | null;
  currentUserIsAdmin: boolean;
  currentLanguage: 'es' | 'en';
}) {

  const T = useMemo(() => ({
    es: {
      unknownDate: "Fecha desconocida",
      invalidDate: "Fecha inválida",
      anonymousUser: "Usuario Anónimo",
      editComment: "Editar comentario",
      deleteComment: "Eliminar comentario",
      confirmDeleteTitle: "¿Eliminar este comentario?",
      confirmDeleteDesc: "Esta acción no se puede deshacer.",
      cancel: "Cancelar",
      delete: "Eliminar",
      reply: "Responder",
    },
    en: {
      unknownDate: "Unknown date",
      invalidDate: "Invalid date",
      anonymousUser: "Anonymous User",
      editComment: "Edit comment",
      deleteComment: "Delete comment",
      confirmDeleteTitle: "Delete this comment?",
      confirmDeleteDesc: "This action cannot be undone.",
      cancel: "Cancel",
      delete: "Delete",
      reply: "Reply",
    }
  })[currentLanguage], [currentLanguage]);
  
  const formatDate = useCallback((timestamp: any) => {
    if (!timestamp) return T.unknownDate;
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
     if (isNaN(date.getTime())) return T.invalidDate;
    return formatDistanceToNow(date, { addSuffix: true, locale: currentLanguage === 'es' ? es : undefined });
  }, [currentLanguage, T]);

  const canEditOrDelete = currentUserId && (comment.autorId === currentUserId || currentUserIsAdmin);
  const postId = useParams().postId as string;

  return (
    <Card
        className={cn(
            "bg-card/60 backdrop-blur-sm shadow-md hover:shadow-primary/20 transition-shadow duration-300 relative group",
            nestingLevel > 0 && "border-l-2 border-primary/30",
            nestingLevel > 1 && "border-l-secondary/40",
            nestingLevel > 2 && "border-l-accent/50",
        )}
        style={{ marginLeft: `${nestingLevel * 1.25}rem`}}
    >
      {nestingLevel > 0 && <GripVertical className="absolute left-[-0.7rem] top-1/2 -translate-y-1/2 h-5 w-5 text-border opacity-50" />}
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9 border-2 border-accent">
                <AvatarImage src={comment.autorFoto || `https://placehold.co/40x40.png?text=${comment.autorNombre?.substring(0,1) || 'U'}`} data-ai-hint="user avatar small" />
                <AvatarFallback className="text-xs bg-muted">{comment.autorNombre?.substring(0,1) || "U"}</AvatarFallback>
            </Avatar>
            <div>
                <p className="text-sm font-semibold text-foreground">{comment.autorNombre || T.anonymousUser}</p>
                <p className="text-xs text-muted-foreground">{formatDate(comment.fecha)}</p>
            </div>
            </div>
            {canEditOrDelete && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onEditComment(comment)} aria-label={T.editComment}>
                        <Edit2 className="h-4 w-4" />
                         <span className="sr-only">{T.editComment}</span>
                    </Button>
                     <AlertDialog>
                        <DeleteDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label={T.deleteComment}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">{T.deleteComment}</span>
                            </Button>
                        </DeleteDialogTrigger>
                        <DeleteDialogContent className="bg-card border-border shadow-xl techno-glow-destructive">
                            <DeleteDialogHeader>
                            <DeleteDialogTitle className="text-foreground text-xl">{T.confirmDeleteTitle}</DeleteDialogTitle>
                            <DeleteDialogDescription className="text-muted-foreground">
                                {T.confirmDeleteDesc}
                            </DeleteDialogDescription>
                            </DeleteDialogHeader>
                            <DeleteDialogFooter>
                            <AlertDialogCancel className="hover:scale-105 transition-transform">{T.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => onDeleteComment(comment.id, postId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 transition-transform"
                            >
                                {T.delete}
                            </AlertDialogAction>
                            </DeleteDialogFooter>
                        </DeleteDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment.contenido}</p>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex items-center justify-start space-x-1 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => onLikeComment(comment.id)} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform disabled:opacity-50" disabled={!currentUserId}>
          <ThumbsUp className="h-4 w-4 mr-1.5" /> {(comment.likes || []).length || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onThankComment(comment.id)} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform group/thank disabled:opacity-50" disabled={!currentUserId}>
          <Heart className="h-4 w-4 mr-1.5 text-red-500/70 group-hover/thank:text-red-500 group-hover/thank:fill-red-500/30" /> {(comment.gracias || []).length || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onReply(comment.id, comment.autorNombre || (currentLanguage === 'es' ? "Comentario" : "Comment"))} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform disabled:opacity-50" disabled={!currentUserId}>
          <CornerDownRight className="h-4 w-4 mr-1.5" /> {T.reply}
        </Button>
      </CardFooter>
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-0 py-3 pr-3 space-y-4">
          {comment.replies.map(reply => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLikeComment={onLikeComment}
              onThankComment={onThankComment}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              nestingLevel={nestingLevel + 1}
              currentUserId={currentUserId}
              currentUserIsAdmin={currentUserIsAdmin}
              currentLanguage={currentLanguage}
            />
          ))}
        </div>
      )}
    </Card>
  );
});
CommentCard.displayName = 'CommentCard';

export default function ForumPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const { toast } = useToast();
  const { user, userProfile, currentLanguage } = useFirebaseAuth();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState<ForumComment | null>(null);

  const T = useMemo(() => ({
    es: {
      backToForums: "Volver a Foros",
      postNotFound: "Publicación no encontrada.",
      errorLoadingPost: "No se pudo cargar la publicación.",
      errorLoadingComments: "No se pudieron cargar los comentarios.",
      deletePostTitle: "¿Eliminar esta publicación?",
      deletePostDesc: "Esta acción no se puede deshacer. Esto eliminará permanentemente la publicación y todos sus comentarios.",
      deleteCommentTitle: "¿Eliminar este comentario?",
      deleteCommentDesc: "Esta acción no se puede deshacer.",
      cancel: "Cancelar",
      delete: "Eliminar",
      postDeleted: "Publicación eliminada.",
      errorDeletingPost: "No se pudo eliminar la publicación.",
      commentDeleted: "Comentario eliminado.",
      errorDeletingComment: "No se pudo eliminar el comentario.",
      editPost: "Editar Publicación", // Placeholder, not fully implemented
      unknownDate: "Fecha desconocida",
      invalidDate: "Fecha inválida",
      anonymousUser: "Usuario Anónimo",
      postedBy: "Publicado por",
      repliesCountSuffix: "Respuestas",
      likes: "Me gusta",
      thanks: "Gracias",
      loginToInteract: "Necesitas iniciar sesión para reaccionar.",
      reactionSent: "Reacción enviada.",
      errorReaction: "No se pudo registrar tu reacción.",
      replyingTo: (name: string) => `Respondiendo a ${name}...`,
      writeNewReply: "Escribe una Nueva Respuesta",
      writeYourReply: "Escribe tu respuesta...",
      writeYourComment: "Escribe tu comentario aquí...",
      cancelReply: "Cancelar Respuesta",
      sendReply: "Enviar Respuesta",
      sending: "Enviando...",
      noCommentsYet: "No hay respuestas aún... ¡Sé el primero en comentar!",
      loginToComment: "Debes iniciar sesión para dejar un comentario.",
      errorCommentEmpty: "El comentario no puede estar vacío.",
      commentSent: "Tu respuesta ha sido publicada.",
      errorSendingComment: "No se pudo enviar tu comentario.",
      commentUpdated: "Comentario actualizado.",
      errorUpdatingComment: "No se pudo actualizar el comentario.",
    },
    en: {
      backToForums: "Back to Forums",
      postNotFound: "Post not found.",
      errorLoadingPost: "Could not load the post.",
      errorLoadingComments: "Could not load comments.",
      deletePostTitle: "Delete this post?",
      deletePostDesc: "This action cannot be undone. This will permanently delete the post and all its comments.",
      deleteCommentTitle: "Delete this comment?",
      deleteCommentDesc: "This action cannot be undone.",
      cancel: "Cancel",
      delete: "Delete",
      postDeleted: "Post deleted.",
      errorDeletingPost: "Could not delete the post.",
      commentDeleted: "Comment deleted.",
      errorDeletingComment: "Could not delete the comment.",
      editPost: "Edit Post",
      unknownDate: "Unknown date",
      invalidDate: "Invalid date",
      anonymousUser: "Anonymous User",
      postedBy: "Posted by",
      repliesCountSuffix: "Replies",
      likes: "Likes",
      thanks: "Thanks",
      loginToInteract: "You need to log in to react.",
      reactionSent: "Reaction sent.",
      errorReaction: "Could not register your reaction.",
      replyingTo: (name: string) => `Replying to ${name}...`,
      writeNewReply: "Write a New Reply",
      writeYourReply: "Write your reply...",
      writeYourComment: "Write your comment here...",
      cancelReply: "Cancel Reply",
      sendReply: "Send Reply",
      sending: "Sending...",
      noCommentsYet: "No replies yet... Be the first to comment!",
      loginToComment: "You must be logged in to leave a comment.",
      errorCommentEmpty: "Comment cannot be empty.",
      commentSent: "Your reply has been posted.",
      errorSendingComment: "Could not send your comment.",
      commentUpdated: "Comment updated.",
      errorUpdatingComment: "Could not update the comment.",
    }
  })[currentLanguage], [currentLanguage]);

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    setFetchError(null);
    const postRef = doc(db, "foros", postId);
    
    const unsubPost = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() } as ForumPost);
      } else {
        setFetchError(T.postNotFound);
        toast({ title: "Error", description: T.postNotFound, variant: "destructive" });
        router.push('/forums');
      }
    }, (error) => {
        console.error("Error fetching post: ", error);
        const errorMessage = error.message.includes("offline") ? "Error al cargar el post (offline)." : T.errorLoadingPost;
        setFetchError(errorMessage);
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
        setIsLoading(false);
    });

    const commentsQuery = query(collection(db, "foros", postId, "comentarios"), orderBy("fecha", "asc"));
    const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
        const fetchedComments: ForumComment[] = [];
        snapshot.forEach((doc) => {
            fetchedComments.push({ id: doc.id, ...doc.data() } as ForumComment);
        });
        setComments(fetchedComments);
        setIsLoading(false); // Set loading false after comments are fetched
    }, (error) => {
        console.error("Error fetching comments: ", error);
        const errorMessage = error.message.includes("offline") ? "Error al cargar comentarios (offline)." : T.errorLoadingComments;
        setFetchError(prevError => prevError || errorMessage); // Keep post error if it exists
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
        setIsLoading(false);
    });

    return () => {
        unsubPost();
        unsubComments();
    };
  }, [postId, router, toast, T]);

  const formatDate = useCallback((timestamp: any) => {
    if (!timestamp) return T.unknownDate;
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return T.invalidDate;
    return formatDistanceToNow(date, { addSuffix: true, locale: currentLanguage === 'es' ? es : undefined });
  }, [currentLanguage, T]);

  const handleReaction = useCallback(async (type: 'likes' | 'gracias', target: 'post' | 'comment', targetId?: string) => {
    if (!user?.uid) {
      toast({ title: "Acción Requerida", description: T.loginToInteract, variant: "destructive" });
      return;
    }

    let docRef;
    if (target === 'post' && post) {
      docRef = doc(db, "foros", post.id);
    } else if (target === 'comment' && targetId) {
      docRef = doc(db, "foros", postId, "comentarios", targetId);
    } else {
      return;
    }
    
    try {
       await runTransaction(db, async (transaction) => {
        const targetDoc = await transaction.get(docRef);
        if (!targetDoc.exists()) {
          throw "Document does not exist!";
        }
        const data = targetDoc.data();
        const currentReactions: string[] = data?.[type] || [];
        let newReactionsUpdate;

        if (currentReactions.includes(user.uid!)) {
          newReactionsUpdate = arrayRemove(user.uid);
        } else {
          newReactionsUpdate = arrayUnion(user.uid);
        }
        transaction.update(docRef, { [type]: newReactionsUpdate });
      });
      toast({description: T.reactionSent});
    } catch (error) {
      console.error("Error updating reaction: ", error);
      toast({ title: "Error", description: T.errorReaction, variant: "destructive" });
    }
  }, [user, post, postId, toast, T]);

  const handleLikePost = useCallback(() => handleReaction('likes', 'post'), [handleReaction]);
  const handleThankPost = useCallback(() => handleReaction('gracias', 'post'), [handleReaction]);
  const handleLikeComment = useCallback((commentId: string) => handleReaction('likes', 'comment', commentId), [handleReaction]);
  const handleThankComment = useCallback((commentId: string) => handleReaction('gracias', 'comment', commentId), [handleReaction]);

  const handleReplyToComment = useCallback((commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, authorName });
    toast({ description: T.replyingTo(authorName)});
    document.getElementById('new-comment-textarea')?.focus();
  }, [T, toast]);

  const handleSubmitComment = useCallback(async () => {
    if (!user?.uid || !userProfile?.nombre) {
      toast({ title: "Error", description: T.loginToComment, variant: "destructive" });
      return;
    }
    if (!newComment.trim()) {
      toast({ title: "Error", description: T.errorCommentEmpty, variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);

    const newCommentData: Omit<ForumComment, 'id' | 'fecha'> = {
      contenido: newComment,
      autorId: user.uid,
      autorNombre: userProfile.nombre || (currentLanguage === 'es' ? "Estudiante Anónimo" : "Anonymous Student"),
      autorFoto: userProfile.fotoPerfil || `https://placehold.co/40x40.png?text=${(userProfile.nombre || "E").substring(0,1)}`,
      respuestaA: replyingTo ? replyingTo.id : undefined,
      likes: [],
      gracias: [],
      replies: [] 
    };

    try {
      const postRef = doc(db, "foros", postId);
      const commentsColRef = collection(db, "foros", postId, "comentarios");
      
      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw "Document does not exist!";
        }
        const newCommentsCount = (postDoc.data().commentsCount || 0) + 1;
        transaction.update(postRef, { commentsCount: newCommentsCount });
        transaction.set(doc(commentsColRef), { ...newCommentData, fecha: serverTimestamp() });
      });

      setNewComment('');
      setReplyingTo(null);
      toast({ title: T.commentSent });
    } catch (error) {
        console.error("Error submitting comment: ", error);
        toast({ title: "Error", description: T.errorSendingComment, variant: "destructive" });
    } finally {
        setIsSubmittingComment(false);
    }
  }, [user, userProfile, newComment, replyingTo, postId, toast, T, currentLanguage]);

  const handleOpenEditCommentDialog = useCallback((comment: ForumComment) => {
    setCommentToEdit(comment);
    setIsEditingComment(true);
  }, []);

  const handleSaveEditedComment = useCallback(async (commentId: string, newContent: string) => {
    const commentRef = doc(db, "foros", postId, "comentarios", commentId);
    try {
      await updateDoc(commentRef, { contenido: newContent });
      toast({ description: T.commentUpdated });
    } catch (error) {
      console.error("Error updating comment: ", error);
      toast({ title: "Error", description: T.errorUpdatingComment, variant: "destructive" });
    }
  }, [postId, toast, T]);

  const handleDeleteComment = useCallback(async (commentId: string, parentPostId: string) => {
    const commentRef = doc(db, "foros", parentPostId, "comentarios", commentId);
    const postRef = doc(db, "foros", parentPostId);
    
    try {
        const batch = writeBatch(db);
        batch.delete(commentRef);
        
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const currentCount = postSnap.data().commentsCount || 0;
            if (currentCount > 0) {
                batch.update(postRef, { commentsCount: currentCount - 1 });
            }
        }
        await batch.commit();
        toast({ description: T.commentDeleted });
    } catch (error) {
        console.error("Error deleting comment: ", error);
        toast({ title: "Error", description: T.errorDeletingComment, variant: "destructive" });
    }
  }, [T, toast]);

  const buildCommentTree = useCallback((commentsList: ForumComment[]): ForumComment[] => {
    const commentsMap = new Map<string, ForumComment>();
    const rootComments: ForumComment[] = [];

    commentsList.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, replies: [] });
    });

    commentsList.forEach(comment => {
      const currentComment = commentsMap.get(comment.id);
      if (currentComment) {
        if (comment.respuestaA && commentsMap.has(comment.respuestaA)) {
          const parentComment = commentsMap.get(comment.respuestaA);
          parentComment?.replies?.push(currentComment);
        } else {
          rootComments.push(currentComment);
        }
      }
    });
    
    const sortRepliesRecursive = (cs: ForumComment[]) => {
        cs.sort((a,b) => (a.fecha?.toDate ? a.fecha.toDate().getTime() : 0) - (b.fecha?.toDate ? b.fecha.toDate().getTime() : 0));
        cs.forEach(c => {
            if (c.replies) sortRepliesRecursive(c.replies);
        });
    };
    sortRepliesRecursive(rootComments);
    return rootComments;
  }, []);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments, buildCommentTree]);

  if (isLoading && !fetchError) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
        <Skeleton className="h-10 w-40 mb-6 rounded-md" />
        <Card className="shadow-xl bg-card">
          <CardHeader className="p-6">
            <Skeleton className="h-10 w-3/4 mb-3 rounded-md" />
            <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-sm" />
                <Skeleton className="h-3 w-40 rounded-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-3 space-y-2">
            <Skeleton className="h-5 w-full rounded-sm" />
            <Skeleton className="h-5 w-full rounded-sm" />
            <Skeleton className="h-5 w-5/6 rounded-sm" />
          </CardContent>
          <CardFooter className="p-6 pt-3 flex items-center justify-start space-x-4">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </CardFooter>
        </Card>
        <Separator className="my-8 bg-border/50"/>
        <Skeleton className="h-8 w-1/3 mb-6 rounded-md" />
        <div className="space-y-5">
          {[1,2].map(i => <Skeleton key={`commentskel-${i}`} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (fetchError && !post) { // If error and no post data, show full page error
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-center p-4">
        <WifiOff className="h-24 w-24 text-destructive mb-6" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">{currentLanguage === 'es' ? 'Error al Cargar' : 'Loading Error'}</h2>
        <p className="text-muted-foreground mb-6">{fetchError}</p>
        <Button variant="outline" onClick={() => router.push('/forums')} className="group">
          <ArrowLeft className="mr-2 h-4 w-4 text-primary group-hover:text-accent-foreground" /> {T.backToForums}
        </Button>
      </div>
    );
  }
  
  if (!post) { // Should be caught by fetchError, but as a fallback
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-muted-foreground">{T.postNotFound}</p></div>;
  }
  
  const canEditOrDeletePost = user && (post.autorId === user.uid || userProfile?.isAdmin);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-2 sm:p-4 md:p-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6 hover:scale-105 hover:bg-accent transition-transform duration-200 group">
        <ArrowLeft className="mr-2 h-4 w-4 text-primary group-hover:text-accent-foreground" /> {T.backToForums}
      </Button>

      <Card className="shadow-xl bg-card techno-glow-secondary">
        <CardHeader className="p-6">
            <div className="flex justify-between items-start">
                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">{post.titulo}</CardTitle>
                {canEditOrDeletePost && (
                    <div className="flex gap-1">
                         <AlertDialog>
                            <DeleteDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={T.delete}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">{T.delete}</span>
                                </Button>
                            </DeleteDialogTrigger>
                            <DeleteDialogContent className="bg-card border-border shadow-xl techno-glow-destructive">
                                <DeleteDialogHeader>
                                <DeleteDialogTitle className="text-foreground text-xl">{T.deletePostTitle}</DeleteDialogTitle>
                                <DeleteDialogDescription className="text-muted-foreground">
                                    {T.deletePostDesc}
                                </DeleteDialogDescription>
                                </DeleteDialogHeader>
                                <DeleteDialogFooter>
                                <AlertDialogCancel className="hover:scale-105 transition-transform">{T.cancel}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={async () => {
                                        try {
                                            await deleteDoc(doc(db, "foros", post.id));
                                            toast({ description: T.postDeleted });
                                            router.push('/forums');
                                        } catch (error) {
                                            toast({ title: "Error", description: T.errorDeletingPost, variant: "destructive"});
                                        }
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 transition-transform"
                                >
                                    {T.delete}
                                </AlertDialogAction>
                                </DeleteDialogFooter>
                            </DeleteDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
          <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-3 flex-wrap">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={post.autorFoto || `https://placehold.co/40x40.png?text=${post.autorNombre?.substring(0,1) || 'U'}`} data-ai-hint="user avatar medium"/>
              <AvatarFallback className="bg-muted">{post.autorNombre?.substring(0,1) || "U"}</AvatarFallback>
            </Avatar>
            <span>{T.postedBy} <span className="font-semibold text-foreground">{post.autorNombre || T.anonymousUser}</span></span>
            <span className="hidden sm:inline">&bull;</span>
            <span>{formatDate(post.fechaCreacion)}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium shadow-sm">{post.categoria}</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 text-base">{post.contenido}</p>
        </CardContent>
        <CardFooter className="p-6 pt-4 flex items-center justify-start space-x-3 flex-wrap gap-y-2">
          <Button variant="ghost" onClick={handleLikePost} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform group/like disabled:opacity-50" disabled={!user}>
            <ThumbsUp className="h-5 w-5 mr-2 group-hover/like:fill-primary/20" /> {(post.likes || []).length || 0} {T.likes}
          </Button>
           <Button variant="ghost" onClick={handleThankPost} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform group/thank disabled:opacity-50" disabled={!user}>
            <Heart className="h-5 w-5 mr-2 text-red-500/70 group-hover/thank:text-red-500 group-hover/thank:fill-red-500/30" /> {(post.gracias || []).length || 0} {T.thanks}
          </Button>
          <div className="flex items-center text-muted-foreground">
            <MessageSquare className="h-5 w-5 mr-2" /> {post.commentsCount || 0} {T.repliesCountSuffix}
          </div>
        </CardFooter>
      </Card>

      <Separator className="my-8 bg-border/50" />

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">{T.repliesCountSuffix} ({post.commentsCount || 0})</h2>
        {fetchError && comments.length === 0 && (
             <Card className="shadow-sm bg-card border-dashed border-border/50">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <WifiOff className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <p className="text-lg font-semibold text-destructive">{currentLanguage === 'es' ? 'Error al Cargar Comentarios' : 'Error Loading Comments'}</p>
                    <p>{currentLanguage === 'es' ? 'No se pudieron cargar los comentarios. Revisa tu conexión.' : 'Could not load comments. Check your connection.'}</p>
                </CardContent>
            </Card>
        )}
        {!fetchError && commentTree.length > 0 ? (
          commentTree.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReplyToComment}
              onLikeComment={handleLikeComment}
              onThankComment={handleThankComment}
              onEditComment={handleOpenEditCommentDialog}
              onDeleteComment={handleDeleteComment}
              currentUserId={user?.uid || null}
              currentUserIsAdmin={userProfile?.isAdmin || false}
              currentLanguage={currentLanguage}
            />
          ))
        ) : !fetchError && (
          <p className="text-muted-foreground italic py-4 text-center">{T.noCommentsYet}</p>
        )}
      </div>

      <Separator className="my-8 bg-border/50"/>

      {user && (
        <Card className="shadow-lg bg-card p-2 sm:p-0">
            <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl text-foreground">
                {replyingTo ? <span className="text-primary">{T.replyingTo(replyingTo.authorName)}</span> : T.writeNewReply}
            </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4">
                <Textarea
                id="new-comment-textarea"
                placeholder={replyingTo ? T.writeYourReply : T.writeYourComment}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="bg-input border-input min-h-[100px] focus:techno-glow-primary"
                disabled={isSubmittingComment}
                />
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    {replyingTo && (
                        <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setNewComment(''); }} disabled={isSubmittingComment} className="w-full sm:w-auto hover:scale-105 transition-transform">
                            {T.cancelReply}
                        </Button>
                    )}
                    <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmittingComment} className="w-full sm:w-auto hover:scale-105 hover:brightness-125 transition-transform techno-glow-primary shadow-md sm:ml-auto">
                    {isSubmittingComment ? T.sending : <><Send className="mr-2 h-4 w-4" /> {T.sendReply}</>}
                    </Button>
                </div>
            </div>
            </CardContent>
        </Card>
      )}
      {!user && (
         <Card className="shadow-md bg-card border-dashed border-border/50">
            <CardContent className="p-10 text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 opacity-50 mb-4 text-primary" />
                <p className="text-lg">{T.loginToComment}</p>
            </CardContent>
        </Card>
      )}
      <EditCommentDialog 
        comment={commentToEdit}
        open={isEditingComment}
        onOpenChange={setIsEditingComment}
        onSave={handleSaveEditedComment}
        currentLanguage={currentLanguage}
      />
    </div>
  );
}

