
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, GraduationCap, HelpCircle, Share2, MessageSquare, ThumbsUp, Heart } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForumPost } from "@/types/firestore"; // Aún usamos el tipo, pero los datos son locales
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Datos de ejemplo locales
const initialPosts: ForumPost[] = [
  { id: '1', titulo: 'Bienvenida al Foro de Profesores', contenido: 'Este es un espacio para discutir temas relevantes para educadores.', autorNombre: 'Admin EduConnect', fechaCreacion: new Date(2024, 6, 1), categoria: 'profesores', likes: 10, gracias: 5, commentsCount: 2 },
  { id: '2', titulo: '¿Cómo usar Genkit en Next.js?', contenido: 'Tengo dudas sobre la integración de Genkit...', autorNombre: 'Estudiante Curioso', fechaCreacion: new Date(2024, 6, 10), categoria: 'estudiantes', likes: 15, gracias: 3, commentsCount: 1 },
  { id: '3', titulo: 'Excelente Guía de Tailwind CSS', contenido: 'Comparto esta guía que me pareció muy útil: [link]', autorNombre: 'Colaborador Anónimo', fechaCreacion: new Date(2024, 6, 15), categoria: 'recursos', likes: 25, gracias: 12, commentsCount: 0 },
];


function CreatePostDialog({ 
  open, 
  onOpenChange,
  onPostCreated
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onPostCreated: (newPost: ForumPost) => void; 
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ForumPost["category"] | "">("");
  const [authorName, setAuthorName] = useState("Usuario Anónimo"); // Nombre de autor simple
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setAuthorName("Usuario Anónimo");
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category) {
      toast({ title: "Error", description: "Por favor, completa todos los campos.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    // Simular un pequeño retraso
    await new Promise(resolve => setTimeout(resolve, 500));

    const newPost: ForumPost = { 
      id: String(Date.now()), // ID simple basado en timestamp
      titulo: title,
      contenido: content,
      categoria: category as ForumPost["category"],
      autorNombre: authorName,
      autorFoto: `https://placehold.co/40x40.png?text=${authorName.substring(0,1) || 'A'}`,
      fechaCreacion: new Date(),
      likes: 0,
      gracias: 0,
      commentsCount: 0,
    };
    
    onPostCreated(newPost);
    toast({ title: "Publicación Creada", description: `La publicación "${title}" ha sido creada.` });
    onOpenChange(false); 
    resetForm();
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">Crear Nueva Publicación</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Comparte tus ideas, preguntas o recursos con la comunidad.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="post-author" className="text-card-foreground">Tu Nombre (Opcional)</Label>
              <Input 
                id="post-author" 
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value || "Usuario Anónimo")}
                className="bg-input border-input" 
                disabled={isSubmitting}
                placeholder="Usuario Anónimo"
              />
            </div>
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
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim() || !category}>
              {isSubmitting ? "Publicando..." : "Publicar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function ForumsPage() {
  const { toast } = useToast();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [posts, setPosts] = useState<ForumPost[]>(initialPosts);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false); // No longer loading from Firebase

  const handlePostCreated = (newPost: ForumPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };
  
  const handleReaction = (postId: string, reactionType: 'likes' | 'gracias') => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, [reactionType]: post[reactionType] + 1 }
          : post
      )
    );
    toast({ description: `¡Has ${reactionType === 'likes' ? 'indicado que te gusta' : 'agradecido'} la publicación!`});
  };


  const postsProfesores = useMemo(() => posts.filter(p => p.categoria === "profesores"), [posts]);
  const postsEstudiantes = useMemo(() => posts.filter(p => p.categoria === "estudiantes"), [posts]);
  const postsRecursos = useMemo(() => posts.filter(p => p.categoria === "recursos"), [posts]);

  const formatDate = (timestamp: any) => { // timestamp can be Date object now
    if (!timestamp) return "Fecha desconocida";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  if (isLoadingPosts) { // Kept for structure, but won't be true for long
     return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Skeleton className="h-10 w-72 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-12 w-56 rounded-md" />
        </header>
        <Tabs defaultValue="profesores" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10 bg-muted">
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-8 w-full rounded-sm" />
          </TabsList>
          <TabsContent value="profesores" className="mt-6">
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-lg" />)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
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
        <Button variant="default" size="lg" onClick={() => setIsCreatePostModalOpen(true)}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Crear Nueva Publicación
        </Button>
      </header>

      <Tabs defaultValue="profesores" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10 bg-muted">
          <TabsTrigger value="profesores" className="py-2 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <GraduationCap className="mr-2 h-4 w-4 sm:hidden md:inline-block" /> Preguntas de Profesores
          </TabsTrigger>
          <TabsTrigger value="estudiantes" className="py-2 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <HelpCircle className="mr-2 h-4 w-4 sm:hidden md:inline-block" /> Soporte Estudiantil
          </TabsTrigger>
          <TabsTrigger value="recursos" className="py-2 sm:py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Share2 className="mr-2 h-4 w-4 sm:hidden md:inline-block" /> Recursos Compartidos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profesores" className="mt-6">
          <ForumCategoryContent 
            categoryName="Preguntas de Profesores" 
            posts={postsProfesores} 
            formatDate={formatDate} 
            onReact={handleReaction}
          />
        </TabsContent>
        <TabsContent value="estudiantes" className="mt-6">
          <ForumCategoryContent 
            categoryName="Soporte Estudiantil" 
            posts={postsEstudiantes} 
            formatDate={formatDate} 
            onReact={handleReaction}
          />
        </TabsContent>
        <TabsContent value="recursos" className="mt-6">
         <ForumCategoryContent 
            categoryName="Recursos Compartidos" 
            posts={postsRecursos} 
            formatDate={formatDate}
            onReact={handleReaction}
          />
        </TabsContent>
      </Tabs>
      
      <CreatePostDialog 
        open={isCreatePostModalOpen} 
        onOpenChange={setIsCreatePostModalOpen} 
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}

function ForumCategoryContent({ 
  categoryName, 
  posts,
  formatDate,
  onReact
}: { 
  categoryName: string; 
  posts: ForumPost[];
  formatDate: (timestamp: any) => string;
  onReact: (postId: string, reactionType: 'likes' | 'gracias') => void;
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
                <CardDescription className="flex items-center gap-2 text-xs mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={post.autorFoto || `https://placehold.co/40x40.png?text=${post.autorNombre?.substring(0,1) || 'A'}`} data-ai-hint="user avatar small"/>
                    <AvatarFallback>{post.autorNombre?.substring(0,1) || "A"}</AvatarFallback>
                  </Avatar>
                  <span>{post.autorNombre || "Usuario Anónimo"}</span>
                  <span>&bull;</span>
                  <span>{formatDate(post.fechaCreacion)}</span>
                </CardDescription>
              </div>
              {/* Edit/Delete buttons removed as user identity is gone */}
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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => onReact(post.id, 'likes')}>
                  <ThumbsUp className="h-4 w-4 mr-1" /><span>{post.likes || 0}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onReact(post.id, 'gracias')}>
                  <Heart className="h-4 w-4 mr-1" /><span>{post.gracias || 0}</span>
                </Button>
            </div>
          </CardFooter>
        </Card>
      )) : (
        <Card className="shadow-sm bg-card">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Image src="https://placehold.co/300x200.png" alt="Sin publicaciones" width={150} height={100} className="mx-auto mb-4 rounded" data-ai-hint="empty state dark"/>
            Aún no hay publicaciones en {categoryName}. ¡Sé el primero en iniciar una discusión!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
