
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ThumbsUp, Send, MessageSquare, Edit, Trash2, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc, runTransaction, increment, where } from 'firebase/firestore';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import type { ForumPost, ForumComment, UserProfile } from '@/types/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent as EditDialogContent, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle, DialogFooter as EditDialogFooter } from "@/components/ui/dialog";

function EditCommentDialog({
  open,
  onOpenChange,
  comment,
  postId 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comment: ForumComment | null;
  postId: string;
}) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (comment && open) {
      setContent(comment.contenido);
    }
  }, [comment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || !content.trim() || !postId) {
      toast({ title: "Error", description: "El contenido no puede estar vacío o falta información.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const commentRef = doc(db, "foros", postId, "comentarios", comment.id);
      await updateDoc(commentRef, { contenido: content });
      toast({ title: "Comentario Actualizado" });
      onOpenChange(false); 
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo actualizar el comentario.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditDialogContent>
        <EditDialogHeader>
          <EditDialogTitle>Editar Comentario</EditDialogTitle>
        </EditDialogHeader>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="my-4"
            disabled={isSubmitting}
          />
          <EditDialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </EditDialogFooter>
        </form>
      </EditDialogContent>
    </Dialog>
  );
}


function CommentCard({ 
  comment, 
  onReply, 
  onLikeComment, 
  onThankComment, 
  currentUserId,
  onEditComment,
  onDeleteCommentInitiate,
  postId,
  nestingLevel = 0
}: { 
  comment: ForumComment; 
  onReply: (commentId: string, authorName: string) => void; 
  onLikeComment: (commentId: string) => void;
  onThankComment: (commentId: string) => void;
  currentUserId: string | null;
  onEditComment: (comment: ForumComment) => void;
  onDeleteCommentInitiate: (comment: ForumComment) => void;
  postId: string;
  nestingLevel?: number;
}) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    const date = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const hasLiked = currentUserId && comment.likes?.includes(currentUserId);
  const hasThanked = currentUserId && comment.gracias?.includes(currentUserId);

  return (
    <Card className="bg-muted/50" style={{ marginLeft: `${nestingLevel * 1.5}rem`}}>
      <CardHeader className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.autorFoto || `https://placehold.co/40x40.png?text=${comment.autorNombre?.substring(0,1) || 'C'}`} data-ai-hint="user avatar small" />
            <AvatarFallback>{comment.autorNombre?.substring(0,1) || "C"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{comment.autorNombre || "Usuario Anónimo"}</p>
            <p className="text-xs text-muted-foreground">{formatDate(comment.fecha)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-foreground whitespace-pre-wrap">{comment.contenido}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-start space-x-2 flex-wrap">
        <Button variant={hasLiked ? "default" : "ghost"} size="sm" onClick={() => onLikeComment(comment.id)} className="text-muted-foreground hover:text-primary disabled:opacity-50" disabled={!currentUserId}>
          <ThumbsUp className="h-4 w-4 mr-1" /> {comment.likes?.length || 0}
        </Button>
        <Button variant={hasThanked ? "default" : "ghost"} size="sm" onClick={() => onThankComment(comment.id)} className="text-muted-foreground hover:text-primary disabled:opacity-50" disabled={!currentUserId}>
          <Heart className="h-4 w-4 mr-1" /> {comment.gracias?.length || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onReply(comment.id, comment.autorNombre || "Comentario")} className="text-muted-foreground hover:text-primary disabled:opacity-50" disabled={!currentUserId}>
          <MessageSquare className="h-4 w-4 mr-1" /> Responder
        </Button>
        {currentUserId === comment.autorId && (
          <>
            <Button variant="ghost" size="sm" onClick={() => onEditComment(comment)} className="text-muted-foreground hover:text-primary">
              <Edit className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDeleteCommentInitiate(comment)} className="text-destructive hover:text-destructive/80">
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
          </>
        )}
      </CardFooter>
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-0 py-3 pr-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentCard 
              key={reply.id} 
              comment={reply} 
              onReply={onReply} 
              onLikeComment={onLikeComment}
              onThankComment={onThankComment}
              currentUserId={currentUserId}
              onEditComment={onEditComment}
              onDeleteCommentInitiate={onDeleteCommentInitiate}
              postId={postId}
              nestingLevel={nestingLevel + 1}
            />
          ))}
        </div>
      )}
    </Card>
  );
}


export default function ForumPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const { toast } = useToast();
  const { user, userId, loading: authLoading } = useFirebaseAuth();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [commentToEdit, setCommentToEdit] = useState<ForumComment | null>(null);
  const [isEditCommentModalOpen, setIsEditCommentModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<ForumComment | null>(null);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    const date = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };
  
  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    const postRef = doc(db, "foros", postId);
    const unsubscribePost = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() } as ForumPost);
      } else {
        toast({ title: "Error", description: "Publicación no encontrada.", variant: "destructive" });
        router.push('/forums');
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching post:", error);
      toast({ title: "Error", description: "No se pudo cargar la publicación.", variant: "destructive" });
      setIsLoading(false);
    });
    return () => unsubscribePost();
  }, [postId, router, toast]);

  useEffect(() => {
    if (!postId) return;
    const commentsRef = collection(db, "foros", postId, "comentarios");
    const q = query(commentsRef, orderBy("fecha", "asc"));
    const unsubscribeComments = onSnapshot(q, (querySnapshot) => {
      const fetchedComments: ForumComment[] = [];
      querySnapshot.forEach((doc) => {
        fetchedComments.push({ id: doc.id, ...doc.data() } as ForumComment);
      });
      setComments(fetchedComments);
    }, (error) => {
      console.error("Error fetching comments:", error);
      toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" });
    });
    return () => unsubscribeComments();
  }, [postId, toast]);

  const handleReaction = async (
    docId: string,
    reactionType: 'likes' | 'gracias',
    isPost: boolean
  ) => {
    if (!userId) {
      toast({ title: "Error", description: "Debes iniciar sesión para reaccionar.", variant: "destructive" });
      return;
    }
    const collectionPath = isPost ? "foros" : `foros/${postId}/comentarios`;
    const docRef = doc(db, collectionPath, docId);
  
    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) {
          throw new Error("El documento no existe.");
        }
    
        const data = docSnap.data();
        const currentReactions: string[] = data?.[reactionType] || [];
        const hasReacted = currentReactions.includes(userId);
    
        if (hasReacted) {
          transaction.update(docRef, { [reactionType]: arrayRemove(userId) });
        } else {
          transaction.update(docRef, { [reactionType]: arrayUnion(userId) });
        }
      });
      // UI will update due to onSnapshot listeners
    } catch (error: any) {
      console.error(`Error procesando reacción ${reactionType}:`, error);
      toast({ title: "Error", description: `No se pudo procesar tu ${reactionType}. ${error.message}`, variant: "destructive" });
    }
  };
  
  const handleLikePost = () => post && handleReaction(post.id, 'likes', true);
  const handleThankPost = () => post && handleReaction(post.id, 'gracias', true);
  const handleLikeComment = (commentId: string) => handleReaction(commentId, 'likes', false);
  const handleThankComment = (commentId: string) => handleReaction(commentId, 'gracias', false);

  const handleReplyToComment = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, authorName });
    toast({ description: `Respondiendo a ${authorName}...`});
    document.getElementById('new-comment-textarea')?.focus();
  };

  const handleSubmitComment = async () => {
    if (!user || !userId || !postId) {
      toast({ title: "Error", description: "Debes iniciar sesión para comentar.", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) {
      toast({ title: "Error", description: "El comentario no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);

    try {
      let userProfile: UserProfile | null = null;
      const userDocRef = doc(db, "usuarios", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        userProfile = userDocSnap.data() as UserProfile;
      }

      const commentData: Omit<ForumComment, 'id' | 'replies'> = {
        contenido: newComment,
        autorId: userId,
        autorNombre: userProfile?.nombre || user.displayName || "Usuario Anónimo",
        autorFoto: userProfile?.fotoPerfil || user.photoURL || "",
        fecha: serverTimestamp(),
        respuestaA: replyingTo ? replyingTo.id : null,
        likes: [],
        gracias: [],
      };
      await addDoc(collection(db, "foros", postId, "comentarios"), commentData);
      
      const postRef = doc(db, "foros", postId);
      await updateDoc(postRef, { commentsCount: increment(1) });

      setNewComment('');
      setReplyingTo(null);
      toast({ title: "Comentario Publicado" });
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      toast({ title: "Error", description: error.message || "No se pudo publicar el comentario.", variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const handleEditComment = (comment: ForumComment) => {
    setCommentToEdit(comment);
    setIsEditCommentModalOpen(true);
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !userId || commentToDelete.autorId !== userId || !postId) {
      toast({ title: "Error", description: "No tienes permiso para eliminar este comentario o falta información.", variant: "destructive" });
      setCommentToDelete(null);
      return;
    }
    try {
      await deleteDoc(doc(db, "foros", postId, "comentarios", commentToDelete.id));
      
      const postRef = doc(db, "foros", postId);
      await updateDoc(postRef, { commentsCount: increment(-1) });
      
      toast({ title: "Comentario Eliminado" });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({ title: "Error", description: "No se pudo eliminar el comentario. " + error.message, variant: "destructive" });
    }
    setCommentToDelete(null); 
  };

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
    return rootComments;
  }, []);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments, buildCommentTree]);

  if (isLoading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-10 w-3/4 mb-2" />
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-1/4" /> 
              <Skeleton className="h-4 w-1/6" /> 
              <Skeleton className="h-4 w-1/5" /> 
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-full mb-1" />
            <Skeleton className="h-5 w-full mb-1" />
            <Skeleton className="h-5 w-3/4 mb-1" />
          </CardContent>
          <CardFooter className="flex items-center justify-start space-x-4">
            <Skeleton className="h-8 w-24" /> 
            <Skeleton className="h-8 w-24" /> 
          </CardFooter>
        </Card>
        <Separator />
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="space-y-3">
          {[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
      </div>
    );
  }

  if (!post) {
    return <div className="flex justify-center items-center h-64"><p>Publicación no encontrada o no disponible.</p></div>;
  }
  
  const hasLikedPost = userId && post.likes?.includes(userId);
  const hasThankedPost = userId && post.gracias?.includes(userId);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a los Foros
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">{post.titulo}</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2 flex-wrap">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.autorFoto || `https://placehold.co/40x40.png?text=${post.autorNombre?.substring(0,1) || 'P'}`} data-ai-hint="user avatar small"/>
              <AvatarFallback>{post.autorNombre?.substring(0,1) || "P"}</AvatarFallback>
            </Avatar>
            <span>Publicado por <span className="font-medium text-foreground">{post.autorNombre || "Usuario Anónimo"}</span></span>
            <span>&bull;</span>
            <span>{formatDate(post.fechaCreacion)}</span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">{post.categoria}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed">{post.contenido}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-start space-x-4 flex-wrap">
          <Button variant={hasLikedPost ? "default" : "ghost"} onClick={handleLikePost} className="text-muted-foreground hover:text-primary disabled:opacity-50" disabled={!userId}>
            <ThumbsUp className="h-5 w-5 mr-2" /> {post.likes?.length || 0} Me gusta
          </Button>
           <Button variant={hasThankedPost ? "default" : "ghost"} onClick={handleThankPost} className="text-muted-foreground hover:text-primary disabled:opacity-50" disabled={!userId}>
            <Heart className="h-5 w-5 mr-2" /> {post.gracias?.length || 0} Gracias
          </Button>
          <div className="flex items-center text-muted-foreground">
            <MessageSquare className="h-5 w-5 mr-2" /> {post.commentsCount || 0} Comentarios
          </div>
        </CardFooter>
      </Card>

      <Separator />

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Comentarios ({post.commentsCount || 0})</h2>
        {commentTree.length > 0 ? (
          commentTree.map(comment => (
            <CommentCard 
              key={comment.id} 
              comment={comment} 
              onReply={handleReplyToComment} 
              onLikeComment={handleLikeComment}
              onThankComment={handleThankComment}
              currentUserId={userId}
              onEditComment={handleEditComment}
              onDeleteCommentInitiate={setCommentToDelete}
              postId={postId}
            />
          ))
        ) : (
          <p className="text-muted-foreground">No hay comentarios aún. ¡Sé el primero en comentar!</p>
        )}
      </div>
      
      <Separator />

      {user ? (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">
              {replyingTo ? `Respondiendo a ${replyingTo.authorName}` : "Añadir un Comentario"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Textarea
                id="new-comment-textarea"
                placeholder={replyingTo ? "Escribe tu respuesta..." : "Escribe tu comentario aquí..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="bg-input border-input"
                disabled={isSubmittingComment}
              />
              {replyingTo && (
                  <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setNewComment(''); }} disabled={isSubmittingComment}>
                      Cancelar Respuesta
                  </Button>
              )}
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmittingComment || !userId}>
                {isSubmittingComment ? "Publicando..." : <><Send className="mr-2 h-4 w-4" /> Publicar Comentario</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md p-6 text-center">
          <p className="text-muted-foreground">Debes <Link href="/login" className="text-primary hover:underline">iniciar sesión</Link> para comentar.</p>
        </Card>
      )}

      <EditCommentDialog
        open={isEditCommentModalOpen}
        onOpenChange={setIsEditCommentModalOpen}
        comment={commentToEdit}
        postId={postId}
      />

      {commentToDelete && (
        <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el comentario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCommentToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
