
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenSquare, School, Users, Package, Globe, MessageSquare, ThumbsUp, Heart, Edit2, Trash2, WifiOff } from "lucide-react"; // Updated icons
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForumPost } from "@/types/firestore";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc, writeBatch, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
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


const CreatePostDialog = React.memo(function CreatePostDialogComponent({
  open,
  onOpenChange,
  onPostCreated,
  editingPost,
  currentUserId,
  currentUserDisplayName,
  currentUserPhotoURL,
  currentLanguage
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void; 
  editingPost: ForumPost | null;
  currentUserId: string | null;
  currentUserDisplayName: string | null;
  currentUserPhotoURL: string | null;
  currentLanguage: 'es' | 'en';
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ForumPost["categoria"] | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editingPost;
  
  const T = useMemo(() => ({
    es: {
      createTitle: "Crear Nueva Publicación",
      editTitle: "Editar Publicación",
      createDescription: "Comparte tus preguntas, ideas o recursos con la comunidad.",
      editDescription: "Modifica los detalles de tu publicación.",
      titleLabel: "Título de la Publicación",
      titlePlaceholder: "Un título descriptivo para tu post...",
      categoryLabel: "Categoría",
      categoryPlaceholder: "Selecciona una categoría",
      catTeachers: "Consultas de Educadores",
      catStudents: "Apoyo entre Estudiantes",
      catResources: "Recursos y Materiales",
      catGeneral: "Discusión General",
      contentLabel: "Contenido de la Publicación",
      contentPlaceholder: "Escribe aquí el contenido detallado de tu publicación...",
      cancel: "Cancelar",
      publish: "Publicar",
      saveChanges: "Guardar Cambios",
      publishing: "Publicando...",
      saving: "Guardando...",
      errorAllFields: "Por favor, completa todos los campos.",
      errorNoUser: "Debes estar conectado para publicar.",
      errorSaving: "No se pudo guardar la publicación.",
      successCreated: (title: string) => `La publicación "${title}" ha sido creada.`,
      successUpdated: (title: string) => `La publicación "${title}" ha sido guardada.`,
    },
    en: {
      createTitle: "Create New Post",
      editTitle: "Edit Post",
      createDescription: "Share your questions, ideas, or resources with the community.",
      editDescription: "Modify the details of your post.",
      titleLabel: "Post Title",
      titlePlaceholder: "A descriptive title for your post...",
      categoryLabel: "Category",
      categoryPlaceholder: "Select a category",
      catTeachers: "Educator Queries",
      catStudents: "Student Support",
      catResources: "Resources & Materials",
      catGeneral: "General Discussion",
      contentLabel: "Post Content",
      contentPlaceholder: "Write the detailed content of your post here...",
      cancel: "Cancel",
      publish: "Publish",
      saveChanges: "Save Changes",
      publishing: "Publishing...",
      saving: "Saving...",
      errorAllFields: "Please fill in all fields.",
      errorNoUser: "You must be logged in to post.",
      errorSaving: "Could not save the post.",
      successCreated: (title: string) => `Post "${title}" has been created.`,
      successUpdated: (title: string) => `Post "${title}" has been saved.`,
    }
  })[currentLanguage], [currentLanguage]);

  useEffect(() => {
    if (open) { 
      if (isEditMode && editingPost) {
        setTitle(editingPost.titulo);
        setContent(editingPost.contenido);
        setCategory(editingPost.categoria);
      } else {
        setTitle("");
        setContent("");
        setCategory("");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPost, isEditMode, open]);


  const resetForm = useCallback(() => {
    setTitle("");
    setContent("");
    setCategory("");
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast({ title: "Error", description: T.errorNoUser, variant: "destructive" });
      return;
    }
    if (!title.trim() || !content.trim() || !category) {
      toast({ title: "Error", description: T.errorAllFields, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    const postData = {
      titulo: title,
      contenido: content,
      categoria: category as ForumPost["categoria"],
      autorId: currentUserId,
      autorNombre: currentUserDisplayName || (currentLanguage === 'es' ? "Estudiante Anónimo" : "Anonymous Student"),
      autorFoto: currentUserPhotoURL || `https://placehold.co/40x40.png?text=${(currentUserDisplayName || "E").substring(0,1)}`,
    };

    try {
      if (isEditMode && editingPost) {
        const postRef = doc(db, "foros", editingPost.id);
        await updateDoc(postRef, {
          titulo: postData.titulo,
          contenido: postData.contenido,
          categoria: postData.categoria,
        });
        toast({ title: T.successUpdated(title) });
      } else {
        await addDoc(collection(db, "foros"), {
          ...postData,
          fechaCreacion: serverTimestamp(),
          likes: [],
          gracias: [],
          commentsCount: 0,
        });
        toast({ title: T.successCreated(title) });
      }
      onPostCreated(); 
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error saving post: ", error);
      toast({ title: "Error al Guardar", description: T.errorSaving, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUserId, title, content, category, T, toast, isEditMode, editingPost, onOpenChange, resetForm, currentUserDisplayName, currentUserPhotoURL, onPostCreated, currentLanguage]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border shadow-xl techno-glow-primary">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl">{isEditMode ? T.editTitle : T.createTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditMode ? T.editDescription : T.createDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="post-title" className="text-foreground">{T.titleLabel}</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-input focus:techno-glow-primary"
                required
                disabled={isSubmitting}
                placeholder={T.titlePlaceholder}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post-category" className="text-foreground">{T.categoryLabel}</Label>
              <Select
                onValueChange={(value) => setCategory(value as ForumPost["categoria"])}
                value={category}
                disabled={isSubmitting}
              >
                <SelectTrigger id="post-category" className="bg-input border-input focus:techno-glow-primary">
                  <SelectValue placeholder={T.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border shadow-lg">
                  <SelectItem value="profesores">{T.catTeachers}</SelectItem>
                  <SelectItem value="estudiantes">{T.catStudents}</SelectItem>
                  <SelectItem value="recursos">{T.catResources}</SelectItem>
                  <SelectItem value="general">{T.catGeneral}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post-content" className="text-foreground">{T.contentLabel}</Label>
              <Textarea
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-input border-input focus:techno-glow-primary min-h-[120px]"
                rows={6}
                required
                disabled={isSubmitting}
                placeholder={T.contentPlaceholder}
              />
            </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }} disabled={isSubmitting} className="hover:scale-105 transition-transform">{T.cancel}</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim() || !category} className="hover:scale-105 hover:brightness-125 transition-transform techno-glow-primary">
              {isSubmitting ? (isEditMode ? T.saving : T.publishing) : (isEditMode ? T.saveChanges : T.publish)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
CreatePostDialog.displayName = 'CreatePostDialog';

const ForumCategoryContent = React.memo(function ForumCategoryContentComponent({
  categoryName,
  posts,
  formatDate,
  onReact,
  currentUserId,
  currentUserIsAdmin,
  onEditPost,
  onDeletePost,
  currentLanguage,
  fetchError
}: {
  categoryName: string;
  posts: ForumPost[];
  formatDate: (timestamp: any) => string;
  onReact: (postId: string, reactionType: 'likes' | 'gracias') => void;
  currentUserId: string | null;
  currentUserIsAdmin: boolean;
  onEditPost: (post: ForumPost) => void;
  onDeletePost: (postId: string) => void;
  currentLanguage: 'es' | 'en';
  fetchError: string | null;
}) {

  const T = useMemo(() => ({
    es: {
      edit: "Editar",
      delete: "Eliminar",
      confirmDeleteTitle: "¿Eliminar esta publicación?",
      confirmDeleteDesc: "Esta acción no se puede deshacer. Esto eliminará permanentemente la publicación y todos sus comentarios.",
      cancel: "Cancelar",
      noPosts: (category: string) => `No hay publicaciones en la categoría ${category}.`,
      beFirst: "¡Sé el primero en crear una publicación!",
      replies: "respuestas",
      likes: "Me gusta",
      thanks: "Gracias",
      loadingError: "Error al Cargar Publicaciones",
      loadingErrorDesc: "No se pudieron cargar las publicaciones. Por favor, revisa tu conexión a internet e inténtalo de nuevo.",
      retry: "Reintentar",
    },
    en: {
      edit: "Edit",
      delete: "Delete",
      confirmDeleteTitle: "Delete this post?",
      confirmDeleteDesc: "This action cannot be undone. This will permanently delete the post and all its comments.",
      cancel: "Cancel",
      noPosts: (category: string) => `There are no posts in the ${category} category.`,
      beFirst: "Be the first to create a post!",
      replies: "replies",
      likes: "Likes",
      thanks: "Thanks",
      loadingError: "Error Loading Posts",
      loadingErrorDesc: "Could not load posts. Please check your internet connection and try again.",
      retry: "Retry",
    }
  })[currentLanguage], [currentLanguage]);

  if (fetchError) {
    return (
      <Card className="shadow-md bg-card border-dashed border-border/50">
        <CardContent className="p-10 text-center text-muted-foreground">
          <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-destructive">{T.loadingError}</h3>
          <p>{fetchError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {posts.length > 0 ? posts.map(post => {
        const canEditOrDelete = currentUserId && (post.autorId === currentUserId || currentUserIsAdmin);
        return (
        <Card key={post.id} className="shadow-lg hover:shadow-primary/40 transition-all duration-300 bg-card hover:scale-[1.02] group overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex justify-between items-start gap-3">
              <div>
                <Link href={`/forums/${post.id}`} passHref>
                  <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer line-clamp-2">{post.titulo}</CardTitle>
                </Link>
                <CardDescription className="flex items-center gap-2 text-xs mt-2 text-muted-foreground flex-wrap">
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarImage src={post.autorFoto || `https://placehold.co/40x40.png?text=${post.autorNombre?.substring(0,1) || 'U'}`} data-ai-hint="user avatar small"/>
                    <AvatarFallback className="text-xs">{post.autorNombre?.substring(0,1) || "U"}</AvatarFallback>
                  </Avatar>
                  <span>{post.autorNombre || (currentLanguage === 'es' ? "Usuario Anónimo" : "Anonymous User")}</span>
                  <span className="hidden sm:inline">&bull;</span>
                  <span>{formatDate(post.fechaCreacion)}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium shrink-0 shadow-sm">{post.categoria}</span>
                {canEditOrDelete && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onEditPost(post)} aria-label={T.edit}>
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">{T.edit}</span>
                        </Button>
                        <AlertDialog>
                            <DeleteDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label={T.delete}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">{T.delete}</span>
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
                                    onClick={() => onDeletePost(post.id)}
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
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{post.contenido}</p>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground flex justify-between items-center pt-4 mt-2 border-t border-border/30 flex-wrap gap-2">
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
                <MessageSquare className="h-4 w-4"/>
                <span>{post.commentsCount || 0} {T.replies}</span>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onReact(post.id, 'likes')} className="hover:bg-accent hover:text-primary hover:scale-110 transition-all disabled:opacity-50" disabled={!currentUserId} aria-label={T.likes}>
                  <ThumbsUp className="h-4 w-4 mr-1.5" /><span>{(post.likes || []).length}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onReact(post.id, 'gracias')} className="hover:bg-accent hover:text-primary group/thank hover:scale-110 transition-all disabled:opacity-50" disabled={!currentUserId} aria-label={T.thanks}>
                  <Heart className="h-4 w-4 mr-1.5 text-red-500/70 group-hover/thank:text-red-500 group-hover/thank:fill-red-500/30" /><span>{(post.gracias || []).length}</span>
                </Button>
            </div>
          </CardFooter>
        </Card>
      )}) : (
        <Card className="shadow-md bg-card border-dashed border-border/50">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Image src="https://placehold.co/300x200.png" alt="Sin publicaciones" width={150} height={100} className="mx-auto mb-6 rounded-lg opacity-50" data-ai-hint="empty void dark"/>
            <p className="text-lg">{T.noPosts(categoryName)}</p>
            <p className="mt-1">{T.beFirst}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
ForumCategoryContent.displayName = 'ForumCategoryContent';


export default function ForumsPage() {
  const { toast } = useToast();
  const { user, userProfile, currentLanguage, authLoading, userProfileLoading } = useFirebaseAuth();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState<ForumPost["categoria"] | "todos">("todos");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const T = useMemo(() => ({
    es: {
      pageTitle: "Foros de DarkAIschool",
      pageDescription: "Participa en discusiones, consulta a educadores y comparte recursos.",
      newPostButton: "Nueva Publicación",
      tabAll: "Todos",
      tabTeachers: "Educadores",
      tabStudents: "Estudiantes",
      tabResources: "Recursos",
      tabGeneral: "General",
      errorLoadingPosts: "No se pudieron cargar las publicaciones.",
      errorDeletingPost: "No se pudo eliminar la publicación.",
      successPostDeleted: "Publicación eliminada con éxito.",
      errorReaction: "No se pudo registrar tu reacción.",
      successReaction: (type: string) => `¡Has ${type === 'likes' ? 'reaccionado' : 'agradecido'}!`,
      loginToReact: "Necesitas iniciar sesión para reaccionar.",
      categoryAllPosts: "Todas las Publicaciones",
    },
    en: {
      pageTitle: "DarkAIschool Discussion Forums",
      pageDescription: "Engage in discussions, consult educators, and share resources.",
      newPostButton: "New Post",
      tabAll: "All",
      tabTeachers: "Educators",
      tabStudents: "Students",
      tabResources: "Resources",
      tabGeneral: "General",
      errorLoadingPosts: "Could not load posts.",
      errorDeletingPost: "Could not delete the post.",
      successPostDeleted: "Post deleted successfully.",
      errorReaction: "Could not register your reaction.",
      successReaction: (type: string) => `You ${type === 'likes' ? 'liked' : 'thanked'}!`,
      loginToReact: "You need to log in to react.",
      categoryAllPosts: "All Posts",
    }
  })[currentLanguage], [currentLanguage]);

  useEffect(() => {
    setIsLoadingPosts(true);
    setFetchError(null);
    const q = query(collection(db, "foros"), orderBy("fechaCreacion", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedPosts: ForumPost[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({ id: doc.id, ...doc.data() } as ForumPost);
      });
      setPosts(fetchedPosts);
      setIsLoadingPosts(false);
    }, (error) => {
      console.error("Error fetching posts: ", error);
      const errorMessage = error.message.includes("offline") 
        ? "Parece que estás offline. No se pudieron cargar las publicaciones."
        : T.errorLoadingPosts;
      setFetchError(errorMessage);
      toast({title: "Error", description: errorMessage, variant: "destructive"});
      setIsLoadingPosts(false);
    });

    return () => unsubscribe();
  }, [toast, T.errorLoadingPosts]);

  const handlePostCreatedOrUpdated = useCallback(() => {
    setEditingPost(null); 
  }, []);

  const handleEditPost = useCallback((post: ForumPost) => {
    setEditingPost(post);
    setIsCreatePostModalOpen(true);
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      const postRef = doc(db, "foros", postId);
      await deleteDoc(postRef);
      toast({ description: T.successPostDeleted });
    } catch (error) {
      console.error("Error deleting post: ", error);
      toast({ title: "Error", description: T.errorDeletingPost, variant: "destructive" });
    }
  }, [toast, T]);


  const handleReaction = useCallback(async (postId: string, reactionType: 'likes' | 'gracias') => {
    if (!user?.uid) {
      toast({ title: "Acción Requerida", description: T.loginToReact, variant: "destructive" });
      return;
    }
    const postRef = doc(db, "foros", postId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw "Document does not exist!";
        }
        const postData = postDoc.data() as ForumPost;
        const currentReactions: string[] = postData[reactionType] || [];
        let newReactionsUpdate;

        if (currentReactions.includes(user.uid!)) {
          newReactionsUpdate = arrayRemove(user.uid);
        } else {
          newReactionsUpdate = arrayUnion(user.uid);
        }
        transaction.update(postRef, { [reactionType]: newReactionsUpdate });
      });
      toast({ description: T.successReaction(reactionType) });
    } catch (error) {
      console.error("Error updating reaction: ", error);
      toast({ title: "Error", description: T.errorReaction, variant: "destructive" });
    }
  }, [user, toast, T]);


  const filteredPosts = useMemo(() => {
    if (activeTab === "todos") return posts;
    return posts.filter(p => p.categoria === activeTab);
  }, [posts, activeTab]);


  const formatDate = useCallback((timestamp: any) => {
    if (!timestamp) return currentLanguage === 'es' ? "Fecha desconocida" : "Unknown date";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
     if (isNaN(date.getTime())) return currentLanguage === 'es' ? "Fecha inválida" : "Invalid date";
    return formatDistanceToNow(date, { addSuffix: true, locale: currentLanguage === 'es' ? es : undefined });
  }, [currentLanguage]);

  if (isLoadingPosts || authLoading || userProfileLoading) {
     return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
          <div>
            <Skeleton className="h-10 md:h-12 w-3/4 md:w-80 mb-3 rounded-md" />
            <Skeleton className="h-5 md:h-6 w-full md:w-96 rounded-md" />
          </div>
          <Skeleton className="h-11 md:h-12 w-full md:w-60 rounded-lg" />
        </header>
        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5 h-auto sm:h-12 bg-muted rounded-lg p-1">
            {[...Array(5)].map((_,i) => <Skeleton key={`tabskel-${i}`} className="h-9 w-full rounded-md m-1" />)}
          </TabsList>
          <TabsContent value="todos" className="mt-8">
            <div className="space-y-6">
              {[...Array(3)].map((_,i) => <Skeleton key={`postskel-${i}`} className="h-40 w-full rounded-xl" />)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{T.pageTitle}</h1>
          <p className="text-muted-foreground text-lg mt-2">
            {T.pageDescription}
          </p>
        </div>
        <Button 
            variant="default" 
            size="lg" 
            onClick={() => { setEditingPost(null); setIsCreatePostModalOpen(true); }} 
            className="hover:scale-105 hover:brightness-125 transition-transform techno-glow-primary shadow-lg"
            disabled={!user} 
        >
            <PenSquare className="mr-2 h-5 w-5" /> {/* Changed from PlusCircle */}
            {T.newPostButton}
        </Button>
      </header>

      <Tabs defaultValue="todos" value={activeTab} onValueChange={(value) => setActiveTab(value as ForumPost["categoria"] | "todos")} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5 h-auto sm:h-12 bg-muted rounded-lg p-1">
          <TabsTrigger value="todos" className="py-2.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:techno-glow-primary rounded-md transition-all">
            <MessageSquare className="mr-2 h-5 w-5" /> {T.tabAll}
          </TabsTrigger>
          <TabsTrigger value="profesores" className="py-2.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:techno-glow-primary rounded-md transition-all">
            <School className="mr-2 h-5 w-5" /> {T.tabTeachers} {/* Changed from GraduationCap */}
          </TabsTrigger>
          <TabsTrigger value="estudiantes" className="py-2.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:techno-glow-primary rounded-md transition-all">
            <Users className="mr-2 h-5 w-5" /> {T.tabStudents} {/* Changed from HelpCircle */}
          </TabsTrigger>
          <TabsTrigger value="recursos" className="py-2.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:techno-glow-primary rounded-md transition-all">
            <Package className="mr-2 h-5 w-5" /> {T.tabResources} {/* Changed from Share2 */}
          </TabsTrigger>
          <TabsTrigger value="general" className="py-2.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:techno-glow-primary rounded-md transition-all">
            <Globe className="mr-2 h-5 w-5" /> {T.tabGeneral} {/* Changed from MessageSquare */}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-8">
          <ForumCategoryContent
            categoryName={activeTab === 'todos' ? T.categoryAllPosts : activeTab}
            posts={filteredPosts}
            formatDate={formatDate}
            onReact={handleReaction}
            currentUserId={user?.uid || null}
            currentUserIsAdmin={userProfile?.isAdmin || false}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            currentLanguage={currentLanguage}
            fetchError={fetchError}
          />
        </TabsContent>
      </Tabs>

      <CreatePostDialog
        open={isCreatePostModalOpen}
        onOpenChange={setIsCreatePostModalOpen}
        onPostCreated={handlePostCreatedOrUpdated}
        editingPost={editingPost}
        currentUserId={user?.uid || null}
        currentUserDisplayName={userProfile?.nombre || user?.displayName || null}
        currentUserPhotoURL={userProfile?.fotoPerfil || user?.photoURL || null}
        currentLanguage={currentLanguage}
      />
    </div>
  );
}
