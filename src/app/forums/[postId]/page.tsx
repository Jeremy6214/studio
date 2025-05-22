
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter }
from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ThumbsUp, Send, MessageSquare, Edit, Trash2, Heart, CornerDownRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { ForumPost, ForumComment } from '@/types/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent as EditDialogContent, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle, DialogFooter as EditDialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';


const allPostsData: ForumPost[] = [
  { id: '1', autorId:'id_admin', titulo: 'Bienvenida a los Foros de Discusión', contenido: 'Este es un espacio para discutir temas relevantes para educadores y estudiantes. \n\n Explorad y compartid conocimientos. Que vuestras discusiones sean productivas. ¡Gracias por participar!', autorNombre: 'Administrador', autorFoto: 'https://placehold.co/40x40.png?text=AD', fechaCreacion: new Date(2024, 6, 1), categoria: 'profesores', likes: 10, gracias: 5, commentsCount: 2, comments: [
    { id: 'c1', autorId: 'id_profX', contenido: '¡Excelente iniciativa! Se necesita más espacios como este.', autorNombre: 'Profesor X', autorFoto: 'https://placehold.co/40x40.png?text=PX', fecha: new Date(2024, 6, 1, 10, 30), likes: 3, gracias: 1, replies: [
      { id: 'c1_r1', autorId: 'id_profY', contenido: 'Totalmente de acuerdo. La colaboración es clave.', autorNombre: 'Profesora Y', autorFoto: 'https://placehold.co/40x40.png?text=PY', fecha: new Date(2024, 6, 1, 11, 0), respuestaA: 'c1', likes: 1, gracias: 0 }
    ]},
    { id: 'c2', autorId: 'id_studentZ', contenido: 'Muy útil para nosotros los estudiantes. Gracias por el espacio.', autorNombre: 'Estudiante Z', autorFoto: 'https://placehold.co/40x40.png?text=EZ', fecha: new Date(2024, 6, 2, 9, 0), likes: 2, gracias: 0 }
  ]},
  { id: '2', autorId:'id_studentC', titulo: '¿Cómo integrar Genkit con Server Components?', contenido: 'Tengo dudas sobre la integración de Genkit con Server Components y Actions. ¿Alguien tiene experiencia?', autorNombre: 'Estudiante Curioso', autorFoto: 'https://placehold.co/40x40.png?text=EC', fechaCreacion: new Date(2024, 6, 10), categoria: 'estudiantes', likes: 15, gracias: 3, commentsCount: 1, comments: [
    { id: 'c3', autorId: 'id_studentO', contenido: 'También busco esta información. Los flujos de datos son complejos.', autorNombre: 'Otro Estudiante', autorFoto: 'https://placehold.co/40x40.png?text=OE', fecha: new Date(2024, 6, 10, 14,0), likes: 5, gracias: 2 }
  ]},
  { id: '3', autorId:'id_anonC', titulo: 'Recurso: Guía de Tailwind CSS', contenido: 'Comparto esta guía que me pareció muy útil para aprender Tailwind CSS desde cero: [link a la guía]. ¡Espero que les sirva!', autorNombre: 'Usuario Anónimo', autorFoto: 'https://placehold.co/40x40.png?text=UA', fechaCreacion: new Date(2024, 6, 15), categoria: 'recursos', likes: 25, gracias: 12, commentsCount: 0, comments: [] },
];


function CommentCard({
  comment,
  onReply,
  onLikeComment,
  onThankComment,
  nestingLevel = 0,
  currentUserId = "uid_test"
}: {
  comment: ForumComment;
  onReply: (commentId: string, authorName: string) => void;
  onLikeComment: (commentId: string) => void;
  onThankComment: (commentId: string) => void;
  nestingLevel?: number;
  currentUserId?: string;
}) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const canEditOrDelete = comment.autorId === currentUserId;


  return (
    <Card
        className={cn(
            "bg-card/60 backdrop-blur-sm shadow-md hover:shadow-primary/20 transition-shadow duration-300",
            nestingLevel > 0 && "border-l-2 border-primary/30",
            nestingLevel > 1 && "border-l-secondary/30"
        )}
        style={{ marginLeft: `${nestingLevel * 1.25}rem`}}
    >
      <CardHeader className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9 border-2 border-accent">
            <AvatarImage src={comment.autorFoto || `https://placehold.co/40x40.png?text=${comment.autorNombre?.substring(0,1) || 'U'}`} data-ai-hint="user avatar small" />
            <AvatarFallback className="text-xs bg-muted">{comment.autorNombre?.substring(0,1) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{comment.autorNombre || "Usuario Anónimo"}</p>
            <p className="text-xs text-muted-foreground">{formatDate(comment.fecha)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment.contenido}</p>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex items-center justify-start space-x-1 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => onLikeComment(comment.id)} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform">
          <ThumbsUp className="h-4 w-4 mr-1.5" /> {comment.likes || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onThankComment(comment.id)} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform">
          <Heart className="h-4 w-4 mr-1.5 text-red-500/70 group-hover:text-red-500" /> {comment.gracias || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onReply(comment.id, comment.autorNombre || "Comentario")} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform">
          <CornerDownRight className="h-4 w-4 mr-1.5" /> Responder
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
              nestingLevel={nestingLevel + 1}
              currentUserId={currentUserId}
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

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('Usuario Anónimo');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const currentUserId = "uid_test";

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    setTimeout(() => {
      const foundPost = allPostsData.find(p => p.id === postId);
      if (foundPost) {
        setPost(foundPost);
        setComments(foundPost.comments || []);
      } else {
        toast({ title: "Error", description: "Publicación no encontrada.", variant: "destructive" });
        router.push('/forums');
      }
      setIsLoading(false);
    }, 700);
  }, [postId, router, toast]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const handleReaction = (type: 'likes' | 'gracias', target: 'post' | 'comment', targetId?: string) => {
    if (target === 'post' && post) {
      setPost(prevPost => prevPost ? { ...prevPost, [type]: (prevPost[type] || 0) + 1 } : null);
      toast({description: `Reacción enviada a la publicación.`});
    } else if (target === 'comment' && targetId) {
      const updateCommentReactions = (commentsList: ForumComment[]): ForumComment[] => {
        return commentsList.map(comment => {
          if (comment.id === targetId) {
            return { ...comment, [type]: (comment[type] || 0) + 1 };
          }
          if (comment.replies) {
            return { ...comment, replies: updateCommentReactions(comment.replies) };
          }
          return comment;
        });
      };
      setComments(prevComments => updateCommentReactions(prevComments));
      toast({description: `Reacción enviada al comentario.`});
    }
  };

  const handleLikePost = () => handleReaction('likes', 'post');
  const handleThankPost = () => handleReaction('gracias', 'post');
  const handleLikeComment = (commentId: string) => handleReaction('likes', 'comment', commentId);
  const handleThankComment = (commentId: string) => handleReaction('gracias', 'comment', commentId);

  const handleReplyToComment = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, authorName });
    toast({ description: `Respondiendo a ${authorName}...`});
    document.getElementById('new-comment-textarea')?.focus();
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({ title: "Error", description: "El comentario no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const newCommentData: ForumComment = {
      id: String(Date.now()),
      contenido: newComment,
      autorId: currentUserId,
      autorNombre: commentAuthor || "Usuario Anónimo",
      autorFoto: `https://placehold.co/40x40.png?text=${(commentAuthor || "U").substring(0,1)}`,
      fecha: new Date(),
      respuestaA: replyingTo ? replyingTo.id : undefined,
      likes: 0,
      gracias: 0,
      replies: []
    };

    if (replyingTo) {
      setComments(prevComments => {
        const addReplyRecursively = (cs: ForumComment[]): ForumComment[] => {
          return cs.map(c => {
            if (c.id === replyingTo.id) {
              return { ...c, replies: [...(c.replies || []), newCommentData] };
            }
            if (c.replies) {
              return { ...c, replies: addReplyRecursively(c.replies) };
            }
            return c;
          });
        };
        return addReplyRecursively(prevComments);
      });
    } else {
      setComments(prevComments => [...prevComments, newCommentData]);
    }

    if (post) {
       setPost(prevPost => prevPost ? {...prevPost, commentsCount: (prevPost.commentsCount || 0) + 1} : null);
    }

    setNewComment('');
    setReplyingTo(null);
    toast({ title: "Comentario Enviado", description: "Tu respuesta ha sido publicada." });
    setIsSubmittingComment(false);
  };

  const buildCommentTree = useCallback((commentsList: ForumComment[]): ForumComment[] => {
    const commentsMap = new Map<string, ForumComment>();
    const rootComments: ForumComment[] = [];

    commentsList.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, replies: comment.replies ? [...comment.replies] : [] });
    });

    commentsList.forEach(originalComment => {
      const currentComment = commentsMap.get(originalComment.id);
      if (currentComment) {
        if (originalComment.respuestaA && commentsMap.has(originalComment.respuestaA)) {
          const parentComment = commentsMap.get(originalComment.respuestaA);
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = [];
            }
            if (!parentComment.replies.find(r => r.id === currentComment.id)) {
                 parentComment.replies.push(currentComment);
            }
          }
        } else if (!originalComment.respuestaA) {
          if (!rootComments.find(r => r.id === currentComment.id)) {
            rootComments.push(currentComment);
          }
        }
      }
    });
    return rootComments.sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, []);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments, buildCommentTree]);

  if (isLoading) {
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
          {[1,2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!post) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-muted-foreground">Publicación no encontrada.</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-2 sm:p-4 md:p-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-6 hover:scale-105 hover:bg-accent transition-transform duration-200 group">
        <ArrowLeft className="mr-2 h-4 w-4 text-primary group-hover:text-accent-foreground" /> Volver a Foros
      </Button>

      <Card className="shadow-xl bg-card techno-glow-secondary">
        <CardHeader className="p-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">{post.titulo}</CardTitle>
          <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-3 flex-wrap">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={post.autorFoto || `https://placehold.co/40x40.png?text=${post.autorNombre?.substring(0,1) || 'U'}`} data-ai-hint="user avatar medium"/>
              <AvatarFallback className="bg-muted">{post.autorNombre?.substring(0,1) || "U"}</AvatarFallback>
            </Avatar>
            <span>Publicado por <span className="font-semibold text-foreground">{post.autorNombre || "Usuario Anónimo"}</span></span>
            <span className="hidden sm:inline">&bull;</span>
            <span>{formatDate(post.fechaCreacion)}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium shadow-sm">{post.categoria}</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 text-base">{post.contenido}</p>
        </CardContent>
        <CardFooter className="p-6 pt-4 flex items-center justify-start space-x-3 flex-wrap">
          <Button variant="ghost" onClick={handleLikePost} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform">
            <ThumbsUp className="h-5 w-5 mr-2" /> {post.likes || 0} Me gusta
          </Button>
           <Button variant="ghost" onClick={handleThankPost} className="text-muted-foreground hover:text-primary hover:bg-accent hover:scale-105 transition-transform">
            <Heart className="h-5 w-5 mr-2 text-red-500/70 group-hover:text-red-500" /> {post.gracias || 0} Gracias
          </Button>
          <div className="flex items-center text-muted-foreground">
            <MessageSquare className="h-5 w-5 mr-2" /> {post.commentsCount || 0} Respuestas
          </div>
        </CardFooter>
      </Card>

      <Separator className="my-8 bg-border/50" />

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Respuestas ({post.commentsCount || 0})</h2>
        {commentTree.length > 0 ? (
          commentTree.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReplyToComment}
              onLikeComment={handleLikeComment}
              onThankComment={handleThankComment}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          <p className="text-muted-foreground italic py-4 text-center">No hay respuestas aún... ¡Sé el primero en comentar!</p>
        )}
      </div>

      <Separator className="my-8 bg-border/50"/>

      <Card className="shadow-lg bg-card p-2 sm:p-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl text-foreground">
            {replyingTo ? <span className="text-primary">Respondiendo a {replyingTo.authorName}</span> : "Escribe una Nueva Respuesta"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="comment-author" className="text-foreground">Tu Nombre (Opcional)</Label>
              <Input
                id="comment-author"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value || "Usuario Anónimo")}
                className="bg-input border-input focus:techno-glow-primary"
                disabled={isSubmittingComment}
                placeholder="Usuario Anónimo"
              />
            </div>
            <Textarea
              id="new-comment-textarea"
              placeholder={replyingTo ? "Escribe tu respuesta..." : "Escribe tu comentario aquí..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="bg-input border-input min-h-[100px] focus:techno-glow-primary"
              disabled={isSubmittingComment}
            />
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {replyingTo && (
                    <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setNewComment(''); }} disabled={isSubmittingComment} className="w-full sm:w-auto hover:scale-105 transition-transform">
                        Cancelar Respuesta
                    </Button>
                )}
                <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmittingComment} className="w-full sm:w-auto hover:scale-105 hover:brightness-125 transition-transform techno-glow-primary shadow-md sm:ml-auto">
                {isSubmittingComment ? "Enviando..." : <><Send className="mr-2 h-4 w-4" /> Enviar Respuesta</>}
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
