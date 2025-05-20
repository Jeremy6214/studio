
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, GraduationCap, HelpCircle, Share2, MessageSquare, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import type { ForumPost, UserProfile } from "@/types/firestore";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';


function CreatePostDialog({ 
  open, 
  onOpenChange, 
  onPostCreated,
  editingPost, // ForumPost | null
  onPostUpdated
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onPostCreated: (post: ForumPost) => void;
  editingPost: ForumPost | null;
  onPostUpdated: (post: ForumPost) => void;
}) {
  const { toast } = useToast();
  const { user, userId } = useFirebaseAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ForumPost["category"] | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingPost && open) {
      setTitle(editingPost.titulo);
      setContent(editingPost.contenido);
      setCategory(editingPost.categoria);
    } else if (!open) {
      resetForm();
    }
  }, [editingPost, open]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userId) {
      toast({ title: "Error", description: "Debes iniciar sesión para publicar.", variant: "destructive" });
      return;
    }
    if (!title.trim() || !content.trim() || !category) {
      toast({ title: "Error", description: "Por favor, completa todos los campos.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);

    try {
      let userProfile: UserProfile | null = null;
      const userDocRef = doc(db, "usuarios", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        userProfile = userDocSnap.data() as UserProfile;
      }


      if (editingPost) {
        const postRef = doc(db, "foros", editingPost.id);
        const updatedPostData = {
          titulo: title,
          contenido: content,
          categoria: category as ForumPost["category"],
        };
        await updateDoc(postRef, updatedPostData);
        onPostUpdated({ ...editingPost, ...updatedPostData });
        toast({ title: "Publicación Actualizada", description: `La publicación "${title}" ha sido actualizada.` });
      } else {
        const newPostData: Omit<ForumPost, 'id' | 'fechaCreacion' | 'likes' | 'gracias'> & { fechaCreacion: any } = {
          titulo: title,
          contenido: content,
          categoria: category as ForumPost["category"],
          autorId: userId,
          autorNombre: userProfile?.nombre || user.displayName || "Usuario Anónimo",
          autorFoto: userProfile?.fotoPerfil || user.photoURL || "",
          fechaCreacion: serverTimestamp(),
          // likes and gracias will be initialized by Firestore or default to empty array if needed by type
        };
        const docRef = await addDoc(collection(db, "foros"), {
          ...newPostData,
          likes: [], // Initialize as empty array
          gracias: [], // Initialize as empty array
          commentsCount: 0,
        });
        onPostCreated({ 
          ...newPostData, 
          id: docRef.id, 
          fechaCreacion: { seconds: Date.now()/1000, nanoseconds: 0}, // Approximate for UI update
          likes: [], 
          gracias: [],
          commentsCount: 0,
        });
        toast({ title: "Publicación Creada", description: `La publicación "${title}" ha sido creada.` });
      }
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating/updating post:", error);
      toast({ title: "Error", description: error.message || "No se pudo crear/actualizar la publicación.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">{editingPost ? "Editar Publicación" : "Crear Nueva Publicación"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingPost ? "Modifica los detalles de tu publicación." : "Comparte tus ideas, preguntas o recursos con la comunidad."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="post-title" className="text-card-foreground">Título</Label>
              <Input 
                id="post-title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-input" 
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post-category" className="text-card-foreground">Categoría</Label>
              <Select 
                onValueChange={(value) => setCategory(value as ForumPost["category"])} 
                value={category}
                disabled={isSubmitting}
              >
                <SelectTrigger id="post-category" className="bg-input border-input">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="profesores">Preguntas de Profesores</SelectItem>
                  <SelectItem value="estudiantes">Soporte Estudiantil</SelectItem>
                  <SelectItem value="recursos">Recursos Compartidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post-content" className="text-card-foreground">Contenido</Label>
              <Textarea 
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-input border-input" 
                rows={6}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim() || !category}>
              {isSubmitting ? (editingPost ? "Actualizando..." : "Publicando...") : (editingPost ? "Actualizar Publicación" : "Publicar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function ForumsPage() {
  const { toast } = useToast();
  const { user, userId, loading: authLoading } = useFirebaseAuth();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<ForumPost | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      try {
        const q = query(collection(db, "foros"), orderBy("fechaCreacion", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedPosts: ForumPost[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ForumPost));
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast({ title: "Error", description: "No se pudieron cargar las publicaciones.", variant: "destructive" });
      }
      setIsLoadingPosts(false);
    };
    fetchPosts();
  }, [toast]);

  const handlePostCreated = (newPost: ForumPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]); // Add to top for immediate visibility
  };

  const handlePostUpdated = (updatedPost: ForumPost) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
    setEditingPost(null);
  };
  
  const handleEditPost = (post: ForumPost) => {
    setEditingPost(post);
    setIsCreatePostModalOpen(true);
  };

  const handleDeletePost = async () => {
    if (!postToDelete || !userId || postToDelete.autorId !== userId) {
      toast({ title: "Error", description: "No tienes permiso para eliminar esta publicación o no hay publicación seleccionada.", variant: "destructive" });
      setPostToDelete(null);
      return;
    }
    try {
      await deleteDoc(doc(db, "foros", postToDelete.id));
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postToDelete.id));
      toast({ title: "Publicación Eliminada", description: `La publicación "${postToDelete.titulo}" ha sido eliminada.` });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error", description: "No se pudo eliminar la publicación.", variant: "destructive" });
    }
    setPostToDelete(null);
  };


  const postsProfesores = useMemo(() => posts.filter(p => p.categoria === "profesores"), [posts]);
  const postsEstudiantes = useMemo(() => posts.filter(p => p.categoria === "estudiantes"), [posts]);
  const postsRecursos = useMemo(() => posts.filter(p => p.categoria === "recursos"), [posts]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    // Firestore Timestamps might not be immediately available as Date objects in client state after creation
    // So we handle both cases: an object with seconds/nanoseconds, or already a Date object.
    const date = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  if (authLoading || isLoadingPosts) {
    return <div className="flex justify-center items-center h-64"><p>Cargando foros...</p></div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Foros de Discusión</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Participa en discusiones temáticas, haz preguntas y comparte recursos.
          </p>
        </div>
        {user ? (
          <Button variant="default" size="lg" onClick={() => { setEditingPost(null); setIsCreatePostModalOpen(true); }}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Crear Nueva Publicación
          </Button>
        ) : (
          <Button variant="outline" size="lg" disabled>
            <PlusCircle className="mr-2 h-5 w-5" />
            Inicia sesión para publicar
          </Button>
        )}
      </header>

      <Tabs defaultValue="preguntas-profesores" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10 bg-muted">
          <TabsTrigger value="preguntas-profesores" className="py-2 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <GraduationCap className="mr-2 h-4 w-4 sm:hidden md:inline-block" /> Preguntas de Profesores
          </TabsTrigger>
          <TabsTrigger value="soporte-estudiantil" className="py-2 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <HelpCircle className="mr-2 h-4 w-4 sm:hidden md:inline-block" /> Soporte Estudiantil
          </TabsTrigger>
          <TabsTrigger value="recursos-compartidos" className="py-2 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Share2 className="mr-2 h-4 w-4 sm:hidden md:inline-block" /> Recursos Compartidos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preguntas-profesores" className="mt-6">
          <ForumCategoryContent categoryName="Preguntas de Profesores" posts={postsProfesores} formatDate={formatDate} currentUserId={userId} onEdit={handleEditPost} onDeleteInitiate={setPostToDelete}/>
        </TabsContent>
        <TabsContent value="soporte-estudiantil" className="mt-6">
          <ForumCategoryContent categoryName="Soporte Estudiantil" posts={postsEstudiantes} formatDate={formatDate} currentUserId={userId} onEdit={handleEditPost} onDeleteInitiate={setPostToDelete}/>
        </TabsContent>
        <TabsContent value="recursos-compartidos" className="mt-6">
         <ForumCategoryContent categoryName="Recursos Compartidos" posts={postsRecursos} formatDate={formatDate} currentUserId={userId} onEdit={handleEditPost} onDeleteInitiate={setPostToDelete}/>
        </TabsContent>
      </Tabs>
      
      <CreatePostDialog 
        open={isCreatePostModalOpen} 
        onOpenChange={setIsCreatePostModalOpen} 
        onPostCreated={handlePostCreated}
        editingPost={editingPost}
        onPostUpdated={handlePostUpdated}
      />

      {postToDelete && (
        <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente la publicación "{postToDelete.titulo}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function ForumCategoryContent({ 
  categoryName, 
  posts,
  formatDate,
  currentUserId,
  onEdit,
  onDeleteInitiate 
}: { 
  categoryName: string; 
  posts: ForumPost[];
  formatDate: (timestamp: any) => string;
  currentUserId: string | null;
  onEdit: (post: ForumPost) => void;
  onDeleteInitiate: (post: ForumPost) => void;
}) {
  return (
    <div className="space-y-4">
      {posts.length > 0 ? posts.map(post => (
        <Card key={post.id} className="shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Link href={`/forums/${post.id}`} passHref>
                  <CardTitle className="text-lg text-primary-foreground hover:text-primary transition-colors cursor-pointer">{post.titulo}</CardTitle>
                </Link>
                <CardDescription className="flex items-center gap-1 text-xs mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={post.autorFoto || `https://placehold.co/40x40.png?text=${post.autorNombre?.substring(0,1) || 'A'}`} data-ai-hint="user avatar small" />
                    <AvatarFallback>{post.autorNombre?.substring(0,1) || "A"}</AvatarFallback>
                  </Avatar>
                  {post.autorNombre || "Usuario Anónimo"} &bull; {formatDate(post.fechaCreacion)}
                </CardDescription>
              </div>
              {currentUserId === post.autorId && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(post)} aria-label="Editar">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteInitiate(post)} aria-label="Eliminar">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{post.contenido}</p>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground flex justify-between items-center">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4"/> 
                <span>{post.commentsCount || 0} comentarios</span>
            </div>
            <div className="flex items-center gap-2">
                <span>👍 {post.likes?.length || 0}</span>
                <span>💖 {post.gracias?.length || 0}</span>
            </div>
          </CardFooter>
        </Card>
      )) : (
        <Card className="shadow-sm bg-card">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Image src="https://placehold.co/300x200.png" alt="Sin publicaciones" width={150} height={100} className="mx-auto mb-4 rounded" data-ai-hint="empty state dark" />
            Aún no hay publicaciones en {categoryName}. ¡Sé el primero en iniciar una discusión!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
