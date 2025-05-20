
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter }
from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ThumbsUp, Send, MessageSquare, Edit, Trash2, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { ForumPost, ForumComment } from '@/types/firestore'; // Usamos los tipos, pero los datos son locales
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
// import { Dialog, DialogContent as EditDialogContent, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle, DialogFooter as EditDialogFooter } from "@/components/ui/dialog"; // Edit dialog removed for simplicity for now


// Simulación de datos de posts (para encontrar el post por ID)
const allPostsData: ForumPost[] = [
  { id: '1', titulo: 'Bienvenida al Foro de Profesores', contenido: 'Este es un espacio para discutir temas relevantes para educadores. \n\n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', autorNombre: 'Admin EduConnect', autorFoto: 'https://placehold.co/40x40.png?text=AD', fechaCreacion: new Date(2024, 6, 1), categoria: 'profesores', likes: 10, gracias: 5, commentsCount: 2, comments: [
    { id: 'c1', contenido: '¡Gran iniciativa!', autorNombre: 'Profesor X', autorFoto: 'https://placehold.co/40x40.png?text=PX', fecha: new Date(2024, 6, 1, 10, 30), likes: 3, gracias: 1, replies: [
      { id: 'c1_r1', contenido: 'Totalmente de acuerdo.', autorNombre: 'Profesor Y', autorFoto: 'https://placehold.co/40x40.png?text=PY', fecha: new Date(2024, 6, 1, 11, 0), respuestaA: 'c1', likes: 1, gracias: 0 }
    ]},
    { id: 'c2', contenido: 'Me parece muy útil.', autorNombre: 'Estudiante Z', autorFoto: 'https://placehold.co/40x40.png?text=EZ', fecha: new Date(2024, 6, 2, 9, 0), likes: 2, gracias: 0 }
  ]},
  { id: '2', titulo: '¿Cómo usar Genkit en Next.js?', contenido: 'Tengo dudas sobre la integración de Genkit con Server Components y Actions. ¿Alguien tiene experiencia?', autorNombre: 'Estudiante Curioso', autorFoto: 'https://placehold.co/40x40.png?text=EC', fechaCreacion: new Date(2024, 6, 10), categoria: 'estudiantes', likes: 15, gracias: 3, commentsCount: 1, comments: [
    { id: 'c3', contenido: 'Yo también tengo esa duda.', autorNombre: 'Otro Estudiante', autorFoto: 'https://placehold.co/40x40.png?text=OE', fecha: new Date(2024, 6, 10, 14,0), likes: 5, gracias: 2 }
  ]},
  { id: '3', titulo: 'Excelente Guía de Tailwind CSS', contenido: 'Comparto esta guía que me pareció muy útil para aprender Tailwind desde cero: [link a la guía]. Espero les sirva.', autorNombre: 'Colaborador Anónimo', autorFoto: 'https://placehold.co/40x40.png?text=CA', fechaCreacion: new Date(2024, 6, 15), categoria: 'recursos', likes: 25, gracias: 12, commentsCount: 0, comments: [] },
];


function CommentCard({ 
  comment, 
  onReply, 
  onLikeComment, 
  onThankComment,
  nestingLevel = 0
}: { 
  comment: ForumComment; 
  onReply: (commentId: string, authorName: string) => void; 
  onLikeComment: (commentId: string) => void;
  onThankComment: (commentId: string) => void;
  nestingLevel?: number;
}) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

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
        <Button variant="ghost" size="sm" onClick={() => onLikeComment(comment.id)} className="text-muted-foreground hover:text-primary">
          <ThumbsUp className="h-4 w-4 mr-1" /> {comment.likes || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onThankComment(comment.id)} className="text-muted-foreground hover:text-primary">
          <Heart className="h-4 w-4 mr-1" /> {comment.gracias || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onReply(comment.id, comment.autorNombre || "Comentario")} className="text-muted-foreground hover:text-primary">
          <MessageSquare className="h-4 w-4 mr-1" /> Responder
        </Button>
        {/* Edit/Delete for comments removed for simplicity without user auth */}
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

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('Usuario Anónimo');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    // Simular carga de datos
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
    }, 500);
  }, [postId, router, toast]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const handleReaction = (type: 'likes' | 'gracias', target: 'post' | 'comment', targetId?: string) => {
    if (target === 'post' && post) {
      setPost(prevPost => prevPost ? { ...prevPost, [type]: prevPost[type] + 1 } : null);
      toast({description: `Reacción enviada a la publicación.`});
    } else if (target === 'comment' && targetId) {
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === targetId ? { ...comment, [type]: comment[type] + 1 } : comment
        )
      );
      // Esto no actualizará los contadores en respuestas anidadas profundamente sin una lógica más compleja de recorrido del árbol
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
    await new Promise(resolve => setTimeout(resolve, 300)); // Simular envío

    const newCommentData: ForumComment = {
      id: String(Date.now()),
      contenido: newComment,
      autorNombre: commentAuthor || "Usuario Anónimo",
      autorFoto: `https://placehold.co/40x40.png?text=${(commentAuthor || "U").substring(0,1)}`,
      fecha: new Date(),
      respuestaA: replyingTo ? replyingTo.id : null,
      likes: 0,
      gracias: 0,
      replies: []
    };

    if (replyingTo) {
      // Añadir como respuesta anidada (simulación simple, no recursiva profunda)
      setComments(prevComments => {
        const addReply = (cs: ForumComment[]): ForumComment[] => {
          return cs.map(c => {
            if (c.id === replyingTo.id) {
              return { ...c, replies: [...(c.replies || []), newCommentData] };
            }
            if (c.replies) {
              return { ...c, replies: addReply(c.replies) };
            }
            return c;
          });
        };
        return addReply(prevComments);
      });
    } else {
      setComments(prevComments => [...prevComments, newCommentData]);
    }
    
    if (post) {
       setPost(prevPost => prevPost ? {...prevPost, commentsCount: prevPost.commentsCount + 1} : null);
    }

    setNewComment('');
    setReplyingTo(null);
    toast({ title: "Comentario Publicado" });
    setIsSubmittingComment(false);
  };
  
  const buildCommentTree = useCallback((commentsList: ForumComment[]): ForumComment[] => {
    const commentsMap = new Map<string, ForumComment>();
    const rootComments: ForumComment[] = [];

    // Clone comments and initialize replies array
    commentsList.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, replies: [] });
    });

    commentsList.forEach(comment => {
      const currentComment = commentsMap.get(comment.id);
      if (currentComment) {
        if (comment.respuestaA && commentsMap.has(comment.respuestaA)) {
          const parentComment = commentsMap.get(comment.respuestaA);
          // Ensure parentComment.replies is initialized
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = [];
            }
            parentComment.replies.push(currentComment);
          }
        } else {
          rootComments.push(currentComment);
        }
      }
    });
    return rootComments;
  }, []);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments, buildCommentTree]);

  if (isLoading) {
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
          <Button variant="ghost" onClick={handleLikePost} className="text-muted-foreground hover:text-primary">
            <ThumbsUp className="h-5 w-5 mr-2" /> {post.likes || 0} Me gusta
          </Button>
           <Button variant="ghost" onClick={handleThankPost} className="text-muted-foreground hover:text-primary">
            <Heart className="h-5 w-5 mr-2" /> {post.gracias || 0} Gracias
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
            />
          ))
        ) : (
          <p className="text-muted-foreground">No hay comentarios aún. ¡Sé el primero en comentar!</p>
        )}
      </div>
      
      <Separator />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">
            {replyingTo ? `Respondiendo a ${replyingTo.authorName}` : "Añadir un Comentario"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="comment-author" className="text-card-foreground">Tu Nombre (Opcional)</Label>
              <Input 
                id="comment-author" 
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value || "Usuario Anónimo")}
                className="bg-input border-input" 
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
              className="bg-input border-input"
              disabled={isSubmittingComment}
            />
            {replyingTo && (
                <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setNewComment(''); }} disabled={isSubmittingComment}>
                    Cancelar Respuesta
                </Button>
            )}
            <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmittingComment}>
              {isSubmittingComment ? "Publicando..." : <><Send className="mr-2 h-4 w-4" /> Publicar Comentario</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
