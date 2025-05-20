
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link"; // Import Link
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, GraduationCap, HelpCircle, Share2, MessageSquare } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Expanded interface for comments and likes
export interface ForumComment {
  id: string;
  author: string;
  date: string;
  content: string;
  replies?: ForumComment[]; // For nested replies
  likes?: number;
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  date: string;
  repliesCount: number; // Renamed from replies for clarity
  lastActivity: string;
  category: "profesores" | "estudiantes" | "recursos";
  content: string; 
  comments?: ForumComment[]; // Array of comments
  likes?: number; // Likes for the post itself
}

const placeholderPosts: ForumPost[] = [
  { id: "post-1", title: "Preguntas sobre la configuración de Genkit", author: "Estudiante_AI", date: "Hace 2 días", repliesCount: 15, lastActivity: "Hace 1 hora", category: "estudiantes", content: "Tengo algunas dudas sobre cómo configurar Genkit para mi proyecto de análisis de sentimientos. Específicamente, estoy buscando la mejor manera de estructurar mis flujos para procesar grandes volúmenes de texto y cómo manejar los límites de tasa de la API de Gemini. ¿Alguien tiene ejemplos o buenas prácticas para compartir?", likes: 5, comments: [{id: "comment-1-1", author: "Profesor_Guru", date: "Hace 1 día", content: "Excelente pregunta. Para Genkit y grandes volúmenes, considera usar flujos batch y quizás herramientas para pre-procesar o segmentar el texto. Revisa la documentación sobre 'retries' y 'rate limiting'.", likes: 3}] },
  { id: "post-2", title: "Recurso: Ingeniería de Prompts Avanzada", author: "Profesor_Guru", date: "Hace 5 días", repliesCount: 7, lastActivity: "Ayer", category: "profesores", content: "Comparto esta guía detallada sobre ingeniería de prompts avanzada, cubriendo técnicas como few-shot, chain-of-thought, y self-consistency. Incluye ejemplos prácticos para modelos de lenguaje grandes. ¡Espero les sea útil!", likes: 12, comments: [] },
  { id: "post-3", title: "Necesito ayuda con la integración de Next.js y Firebase", author: "Desarrollador_Novato", date: "Hace 1 día", repliesCount: 22, lastActivity: "Hace 30 minutos", category: "estudiantes", content: "Estoy atascado con la integración de Next.js (App Router) y Firebase Authentication. Sigo los tutoriales pero obtengo errores de hidratación y el estado del usuario no persiste correctamente entre navegaciones. ¿Algún consejo o ejemplo de configuración funcional?", likes: 8, comments: [] },
  { id: "post-4", title: "Compartiendo mi nueva idea de proyecto IA", author: "Innovador_X", date: "Hace 3 días", repliesCount: 5, lastActivity: "Hace 2 horas", category: "recursos", content: "He pensado en un proyecto IA para analizar sentimientos en tiempo real de comentarios de YouTube durante transmisiones en vivo, usando Genkit y Gemini para el análisis y Firebase para almacenar los resultados. ¿Qué les parece la viabilidad?", likes: 3, comments: [] },
  { id: "post-5", title: "Discusión sobre Ética de la IA en la Educación", author: "FilosofoAI", date: "Hace 1 semana", repliesCount: 30, lastActivity: "Hace 5 horas", category: "profesores", content: "Abro debate sobre las implicaciones éticas de la IA en el ámbito educativo. ¿Cómo podemos asegurar un uso responsable y equitativo de estas herramientas, minimizando sesgos y promoviendo el pensamiento crítico en lugar de la dependencia?", likes: 25, comments: [] },
];

function ForumCategoryContent({ categoryName, posts }: { categoryName: string; posts: ForumPost[] }) {
  return (
    <div className="space-y-4">
      {posts.length > 0 ? posts.map(post => (
        <Card key={post.id} className="shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader>
            <Link href={`/forums/${post.id}`} passHref>
              <CardTitle className="text-lg text-primary-foreground hover:text-primary transition-colors cursor-pointer">{post.title}</CardTitle>
            </Link>
            <CardDescription>
              Por {post.author} el {post.date}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground flex justify-between items-center">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4"/> 
                <span>{post.repliesCount} respuestas</span>
            </div>
            <span>Última actividad: {post.lastActivity}</span>
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

function CreatePostDialog({ open, onOpenChange, onPostCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onPostCreated: (post: ForumPost) => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"profesores" | "estudiantes" | "recursos" | "">("");

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
  };

  useEffect(() => {
    if (!open) {
      // Delay reset to allow animation to finish, or if content needs to persist while dialog is closing for some reason
      // setTimeout(resetForm, 300); 
      resetForm(); // Reset immediately for now
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !category) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      });
      return;
    }
    
    const newPost: ForumPost = {
      id: `post-${String(Date.now())}`, // Ensure unique ID
      title,
      content,
      category: category as "profesores" | "estudiantes" | "recursos",
      author: "Usuario Actual", // Simular usuario actual
      date: "Ahora mismo",
      repliesCount: 0,
      lastActivity: "Ahora mismo",
      comments: [],
      likes: 0,
    };
    onPostCreated(newPost);
    toast({
      title: "Publicación Creada",
      description: `La publicación "${title}" ha sido creada en la categoría ${category}.`,
    });
    onOpenChange(false); 
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Label htmlFor="post-title" className="text-card-foreground">Título</Label>
              <Input 
                id="post-title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-input" 
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post-category" className="text-card-foreground">Categoría</Label>
              <Select onValueChange={(value) => setCategory(value as any)} value={category}>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Publicar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function ForumsPage() {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [activePosts, setActivePosts] = useState<ForumPost[]>(placeholderPosts);

  const handlePostCreated = (newPost: ForumPost) => {
    setActivePosts(prevPosts => [newPost, ...prevPosts]);
  };

  const postsProfesores = useMemo(() => activePosts.filter(p => p.category === "profesores"), [activePosts]);
  const postsEstudiantes = useMemo(() => activePosts.filter(p => p.category === "estudiantes"), [activePosts]);
  const postsRecursos = useMemo(() => activePosts.filter(p => p.category === "recursos"), [activePosts]);


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
          <ForumCategoryContent categoryName="Preguntas de Profesores" posts={postsProfesores} />
        </TabsContent>
        <TabsContent value="soporte-estudiantil" className="mt-6">
          <ForumCategoryContent categoryName="Soporte Estudiantil" posts={postsEstudiantes} />
        </TabsContent>
        <TabsContent value="recursos-compartidos" className="mt-6">
         <ForumCategoryContent categoryName="Recursos Compartidos" posts={postsRecursos} />
        </TabsContent>
      </Tabs>
      <CreatePostDialog open={isCreatePostModalOpen} onOpenChange={setIsCreatePostModalOpen} onPostCreated={handlePostCreated} />
    </div>
  );
}

// Export types for use in [postId] page
export { placeholderPosts as mockForumPosts };
