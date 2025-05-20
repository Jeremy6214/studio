
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ThumbsUp, MessageSquare, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { ForumPost, ForumComment } from '../page'; // Import types
import { mockForumPosts } from '../page'; // Import mock data

// Placeholder function to simulate fetching a post
async function getPostById(postId: string): Promise<ForumPost | undefined> {
  // In a real app, fetch from your backend/DB (e.g., Firebase Firestore)
  return new Promise(resolve => {
    setTimeout(() => {
      const post = mockForumPosts.find(p => p.id === postId);
      resolve(post);
    }, 500);
  });
}


function CommentCard({ comment, onReply, onLike }: { comment: ForumComment; onReply: (commentId: string) => void; onLike: (commentId: string) => void; }) {
  return (
    <Card className="bg-muted/50">
      <CardHeader className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://placehold.co/40x40.png?text=${comment.author.substring(0,1)}`} data-ai-hint="user avatar small" />
            <AvatarFallback>{comment.author.substring(0,1)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{comment.author}</p>
            <p className="text-xs text-muted-foreground">{comment.date}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-foreground">{comment.content}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-start space-x-4">
        <Button variant="ghost" size="sm" onClick={() => onLike(comment.id)} className="text-muted-foreground hover:text-primary">
          <ThumbsUp className="h-4 w-4 mr-1" /> {comment.likes || 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onReply(comment.id)} className="text-muted-foreground hover:text-primary">
          <MessageSquare className="h-4 w-4 mr-1" /> Responder
        </Button>
      </CardFooter>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 pl-4 border-l border-border space-y-3 py-3 pr-3">
          {comment.replies.map(reply => (
            <CommentCard key={reply.id} comment={reply} onReply={onReply} onLike={onLike}/>
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
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // ID of comment being replied to

  useEffect(() => {
    if (postId) {
      setIsLoading(true);
      getPostById(postId).then(data => {
        if (data) {
          setPost(data);
        } else {
          // Handle post not found, e.g., redirect or show error
          toast({ title: "Error", description: "Publicación no encontrada.", variant: "destructive" });
          router.push('/forums');
        }
        setIsLoading(false);
      });
    }
  }, [postId, router, toast]);

  const handleLikePost = () => {
    if (!post) return;
    // Simulate liking a post
    setPost(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
    toast({ title: "Te gusta esta publicación!" });
    // In real app: await updatePostLikes(postId, newLikes);
  };

  const handleLikeComment = (commentId: string) => {
     if (!post) return;
    // Simulate liking a comment (needs recursive update for nested comments)
    const updateLikesRecursive = (comments: ForumComment[]): ForumComment[] => {
        return comments.map(c => {
            if (c.id === commentId) {
                return { ...c, likes: (c.likes || 0) + 1 };
            }
            if (c.replies) {
                return { ...c, replies: updateLikesRecursive(c.replies) };
            }
            return c;
        });
    };
    setPost(prev => prev ? { ...prev, comments: updateLikesRecursive(prev.comments || []) } : null);
    toast({ title: "Te gusta este comentario!" });
    // In real app: await updateCommentLikes(commentId, newLikes);
  };
  
  const handleReplyToComment = (commentId: string) => {
    setReplyingTo(commentId); // Focus textarea or show specific reply form
    const commentAuthor = post?.comments?.find(c => c.id === commentId)?.author || 'comentario';
    toast({ description: `Respondiendo a ${commentAuthor}...`});
    // You might want to scroll to the comment input textarea here
    // document.getElementById('new-comment-textarea')?.focus();
  };


  const handleSubmitComment = () => {
    if (!post || !newComment.trim()) return;
    const newCommentData: ForumComment = {
      id: `comment-${Date.now()}`,
      author: "Usuario Actual", // Simulate logged-in user
      date: "Ahora mismo",
      content: newComment,
      likes: 0,
      replies: [],
    };

    if (replyingTo) {
        // Add reply to a specific comment (needs recursive logic for deeply nested replies)
        // This is a simplified version for one level of reply.
        const addReplyRecursive = (comments: ForumComment[]): ForumComment[] => {
            return comments.map(c => {
                if (c.id === replyingTo) {
                    return { ...c, replies: [...(c.replies || []), newCommentData] };
                }
                if (c.replies) {
                    return { ...c, replies: addReplyRecursive(c.replies) };
                }
                return c;
            });
        };
        setPost(prev => prev ? { ...prev, comments: addReplyRecursive(prev.comments || []) } : null);
        setReplyingTo(null); // Reset replyingTo state
    } else {
        // Add new top-level comment
        setPost(prev => prev ? { ...prev, comments: [...(prev.comments || []), newCommentData] } : null);
    }
    
    setNewComment('');
    toast({ title: "Comentario Publicado" });
    // In real app: await addCommentToPost(postId, newCommentData, replyingTo);
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p>Cargando publicación...</p></div>;
  }

  if (!post) {
    return <div className="flex justify-center items-center h-64"><p>Publicación no encontrada.</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a los Foros
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">{post.title}</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://placehold.co/40x40.png?text=${post.author.substring(0,1)}`} data-ai-hint="user avatar small"/>
              <AvatarFallback>{post.author.substring(0,1)}</AvatarFallback>
            </Avatar>
            <span>Publicado por <span className="font-medium text-foreground">{post.author}</span></span>
            <span>&bull;</span>
            <span>{post.date}</span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">{post.category}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-start space-x-4">
          <Button variant="ghost" onClick={handleLikePost} className="text-muted-foreground hover:text-primary">
            <ThumbsUp className="h-5 w-5 mr-2" /> {post.likes || 0} Me gusta
          </Button>
          <div className="flex items-center text-muted-foreground">
            <MessageSquare className="h-5 w-5 mr-2" /> {post.comments?.length || 0} Comentarios
          </div>
        </CardFooter>
      </Card>

      <Separator />

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Comentarios</h2>
        {post.comments && post.comments.length > 0 ? (
          post.comments.map(comment => (
            <CommentCard key={comment.id} comment={comment} onReply={handleReplyToComment} onLike={handleLikeComment} />
          ))
        ) : (
          <p className="text-muted-foreground">No hay comentarios aún. ¡Sé el primero en comentar!</p>
        )}
      </div>
      
      <Separator />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Añadir un Comentario {replyingTo ? `(respondiendo a un comentario)` : ''}</CardTitle>
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
            />
            {replyingTo && (
                <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setNewComment(''); }}>
                    Cancelar Respuesta
                </Button>
            )}
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              <Send className="mr-2 h-4 w-4" /> Publicar Comentario
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
