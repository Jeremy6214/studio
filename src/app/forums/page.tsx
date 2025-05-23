
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
import type { ForumPost } from "@/types/firestore";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const initialPosts: ForumPost[] = [
  { id: '1', titulo: 'Bienvenida a los Foros de Discusión', contenido: 'Este es un espacio para discutir temas relevantes para educadores y estudiantes de EduConnect. ¡Comparte tus conocimientos!', autorId:'uid_system', autorNombre: 'Administrador', autorFoto: 'https://placehold.co/40x40.png?text=AD', fechaCreacion: new Date(2024, 6, 1), categoria: 'profesores', likes: 10, gracias: 5, commentsCount: 2 },
  { id: '2', titulo: '¿Cómo integrar Genkit con Server Components?', contenido: 'Tengo dudas sobre la integración de Genkit con Server Components y Actions. ¿Alguien tiene experiencia?', autorId:'uid_student1', autorNombre: 'Estudiante Curioso', autorFoto: 'https://placehold.co/40x40.png?text=EC', fechaCreacion: new Date(2024, 6, 10), categoria: 'estudiantes', likes: 15, gracias: 3, commentsCount: 1 },
  { id: '3', titulo: 'Guía Útil: Introducción a Tailwind CSS', contenido: 'Comparto esta guía que me pareció muy útil para aprender Tailwind desde cero: [link a la guía]. Espero les sirva.', autorId:'uid_collaborator', autorNombre: 'Colaborador Anónimo', autorFoto: 'https://placehold.co/40x40.png?text=CA', fechaCreacion: new Date(2024, 6, 15), categoria: 'recursos', likes: 25, gracias: 12, commentsCount: 0 },
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
  const [category, setCategory] = useState<ForumPost["categoria"] | "">("");
  const [authorName, setAuthorName] = useState("Usuario Anónimo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setAuthorName("Usuario Anónimo");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category) {
      toast({ title: "Error", description: "Por favor, completa todos los campos de la publicación.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const newPostData: ForumPost = {
      id: String(Date.now()),
      titulo: title,
      contenido: content,
      categoria: category as ForumPost["categoria"],
      autorId: "uid_test", // Simulated user
      autorNombre: authorName,
      autorFoto: `https://placehold.co/40x40.png?text=${authorName.substring(0,1) || 'U'}`,
      fechaCreacion: new Date(),
      likes: 0,
      gracias: 0,
      commentsCount: 0,
    };

    onPostCreated(newPostData);
    toast({ title: "Publicación Enviada", description: `La publicación "${title}" ha sido creada.` });
    onOpenChange(false);
    resetForm();
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border shadow-xl techno-glow-primary">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl">Crear Nueva Publicación</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Comparte tus preguntas, ideas o recursos con la comunidad.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="post-author" className="text-foreground">Tu Nombre (Opcional)</Label>
              <Input
                id="post-author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value || "Usuario Anónimo")}
                className="bg-input border-input focus:techno-glow-primary"
                disabled={isSubmitting}
                placeholder="Usuario Anónimo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post-title" className="text-foreground">Título de la Publicación</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-input focus:techno-glow-primary"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post-category" className="text-foreground">Categoría</Label>
              <Select
                onValueChange={(value) => setCategory(value as ForumPost["categoria"])}
                value={category}
                disabled={isSubmitting}
              >
                <SelectTrigger id="post-category" className="bg-input border-input focus:techno-glow-primary">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border shadow-lg">
                  <SelectItem value="profesores">Consultas de Educadores</SelectItem>
                  <SelectItem value="estudiantes">Apoyo entre Estudiantes</SelectItem>
                  <SelectItem value="recursos">Recursos y Materiales</SelectItem>
                  <SelectItem value="general">Discusión General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post-content" className="text-foreground">Contenido de la Publicación</Label>
              <Textarea
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-input border-input focus:techno-glow-primary min-h-[120px]"
                rows={6}
                required
                disabled={isSubmitting}
              />
            </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }} disabled={isSubmitting} className="hover:scale-105 transition-transform">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim() || !category} className="hover:scale-105 hover:brightness-125 transition-transform techno-glow-primary">
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
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
        setIsLoadingPosts(false);
    }, 300);
  }, []);

  const handlePostCreated = (newPost: ForumPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts].sort((a,b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()));
  };

  const handleReaction = (postId: string, reactionType: 'likes' | 'gracias') => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, [reactionType]: (post[reactionType] || 0) + 1 }
          : post
      )
    );
    toast({ description: `¡Has ${reactionType === 'likes' ? 'reaccionado con Me Gusta' : 'agradecido'} la publicación!`});
  };


  const postsProfesores = useMemo(() => posts.filter(p => p.categoria === "profesores"), [posts]);
  const postsEstudiantes = useMemo(() => posts.filter(p => p.categoria === "estudiantes"), [posts]);
  const postsRecursos = useMemo(() => posts.filter(p => p.categoria === "recursos"), [posts]);
  const postsGeneral = useMemo(() => posts.filter(p => p.categoria === "general"), [posts]);


  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  if (isLoadingPosts) {
     return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
          <div>
            <Skeleton className="h-12 w-80 mb-3 rounded-md" />
            <Skeleton className="h-6 w-96 rounded-md" />
          </div>
          <Skeleton className="h-12 w-60 rounded-lg" />
        </header>
        <Tabs defaultValue="profesores" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 h-auto sm:h-12 bg-muted rounded-lg">
            <Skeleton className="h-9 w-full rounded-md m-1" />
            <Skeleton className="h-9 w-full rounded-md m-1" />
            <Skeleton className="h-9 w-full rounded-md m-1" />
            <Skeleton className="h-9 w-full rounded-md m-1" />
          </TabsList>
          <TabsContent value="profesores" className="mt-8">
            <div className="space-y-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Foros de Discusión de EduConnect</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Participa en discusiones, consulta a educadores y comparte recursos.
          </p>
        </div>
        <Button variant="default" size="lg" onClick={() => setIsCreatePostModalOpen(true)} className="hover:scale-105 hover:brightness-125 transition-transform techno-glow-primary shadow-lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nueva Publicación
        </Button>
      </header>

      <Tabs defaultValue="profesores" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 h-auto sm:h-12 bg-muted rounded-lg p-1">
          <TabsTrigger value="profesores" className="py-2.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:techno-glow-primary rounded-md transition-all">
            <GraduationCap className="mr-2 h-5 w-5" /> Consultas Educadores
          </TabsTrigger>
          <TabsTrigger value="estudiantes" className="py-2.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:techno-glow-primary rounded-md transition-all">
            <HelpCircle className="mr-2 h-5 w-5" /> Apoyo Estudiantes
          </TabsTrigger>
          <TabsTrigger value="recursos" className="py-2.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:techno-glow-primary rounded-md transition-all">
            <Share2 className="mr-2 h-5 w-5" /> Recursos y Materiales
          </TabsTrigger>
          <TabsTrigger value="general" className="py-2.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:techno-glow-primary rounded-md transition-all">
            <MessageSquare className="mr-2 h-5 w-5" /> Discusión General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profesores" className="mt-8">
          <ForumCategoryContent
            categoryName="Consultas de Educadores"
            posts={postsProfesores}
            formatDate={formatDate}
            onReact={handleReaction}
          />
        </TabsContent>
        <TabsContent value="estudiantes" className="mt-8">
          <ForumCategoryContent
            categoryName="Apoyo entre Estudiantes"
            posts={postsEstudiantes}
            formatDate={formatDate}
            onReact={handleReaction}
          />
        </TabsContent>
        <TabsContent value="recursos" className="mt-8">
         <ForumCategoryContent
            categoryName="Recursos y Materiales Compartidos"
            posts={postsRecursos}
            formatDate={formatDate}
            onReact={handleReaction}
          />
        </TabsContent>
         <TabsContent value="general" className="mt-8">
         <ForumCategoryContent
            categoryName="Discusión General"
            posts={postsGeneral}
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
    <div className="space-y-6">
      {posts.length > 0 ? posts.map(post => (
        <Card key={post.id} className="shadow-lg hover:shadow-primary/40 transition-all duration-300 bg-card hover:scale-[1.02] group overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex justify-between items-start gap-3">
              <div>
                <Link href={`/forums/${post.id}`} passHref>
                  <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer line-clamp-2">{post.titulo}</CardTitle>
                </Link>
                <CardDescription className="flex items-center gap-2 text-xs mt-2 text-muted-foreground">
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarImage src={post.autorFoto || `https://placehold.co/40x40.png?text=${post.autorNombre?.substring(0,1) || 'U'}`} data-ai-hint="user avatar small"/>
                    <AvatarFallback className="text-xs">{post.autorNombre?.substring(0,1) || "U"}</AvatarFallback>
                  </Avatar>
                  <span>{post.autorNombre || "Usuario Anónimo"}</span>
                  <span>&bull;</span>
                  <span>{formatDate(post.fechaCreacion)}</span>
                </CardDescription>
              </div>
              <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium shrink-0">{post.categoria}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{post.contenido}</p>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground flex justify-between items-center pt-4 mt-2 border-t border-border/30">
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
                <MessageSquare className="h-4 w-4"/>
                <span>{post.commentsCount || 0} respuestas</span>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onReact(post.id, 'likes')} className="hover:bg-accent hover:text-primary hover:scale-110 transition-all">
                  <ThumbsUp className="h-4 w-4 mr-1.5" /><span>{post.likes || 0}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onReact(post.id, 'gracias')} className="hover:bg-accent hover:text-primary hover:scale-110 transition-all">
                  <Heart className="h-4 w-4 mr-1.5" /><span>{post.gracias || 0}</span>
                </Button>
            </div>
          </CardFooter>
        </Card>
      )) : (
        <Card className="shadow-md bg-card border-dashed border-border/50">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Image src="https://placehold.co/300x200.png" alt="Sin publicaciones" width={150} height={100} className="mx-auto mb-6 rounded-lg opacity-50" data-ai-hint="empty void dark"/>
            <p className="text-lg">No hay publicaciones en la categoría <span className="font-semibold text-primary">{categoryName}</span>.</p>
            <p className="mt-1">¡Sé el primero en crear una publicación!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
