
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, Download, Search, FileText, BookCopy, Presentation, Video, Database, X } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface StudyMaterial {
  id: string;
  title: string;
  type: string; 
  subject: string; 
  uploader: string; 
  uploadDate: string;
  size: string;
  icon: React.ElementType;
}

const placeholderMaterials: StudyMaterial[] = [
  { id: "1", title: "Conceptos Avanzados de IA PDF", type: "Documento", subject: "Fundamentos de IA", uploader: "Prof. Sintaxis", uploadDate: "2024-07-15", size: "2.5 MB", icon: FileText },
  { id: "2", title: "Tutoriales en Video de Genkit", type: "Serie de Videos", subject: "Genkit", uploader: "Mentor IA", uploadDate: "2024-07-10", size: "1.2 GB", icon: Video },
  { id: "3", title: "Ejercicios de Codificación Interactivos", type: "Recurso Web", subject: "Programación", uploader: "Gremio de Desarrollo", uploadDate: "2024-07-20", size: "N/A", icon: BookCopy },
  { id: "4", title: "Conjunto de Datos para Entrenamiento de Modelos", type: "Dataset", subject: "Machine Learning", uploader: "Guardián de Datos", uploadDate: "2024-07-05", size: "800 MB", icon: Database },
  { id: "5", title: "Presentación: Ética en IA", type: "Diapositivas", subject: "Ética en IA", uploader: "Dra. Ética", uploadDate: "2024-07-18", size: "5.0 MB", icon: Presentation },
  { id: "6", title: "Guía de Inicio Rápido para Next.js", type: "Documento", subject: "Programación", uploader: "Prof. Sintaxis", uploadDate: "2024-07-22", size: "1.1 MB", icon: FileText },
  { id: "7", title: "Introducción a Tailwind CSS", type: "Serie de Videos", subject: "Programación", uploader: "Mentor IA", uploadDate: "2024-07-12", size: "600 MB", icon: Video },
];

const allSubjects = Array.from(new Set(placeholderMaterials.map(m => m.subject)));
const allTypes = Array.from(new Set(placeholderMaterials.map(m => m.type)));

function UploadMaterialDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de subida simulada
    toast({
      title: "Subida de Material (Simulada)",
      description: `Material "${title}" preparado para subida. Asignatura: ${subject}. Archivo: ${file?.name || 'No seleccionado'}`,
    });
    onOpenChange(false); // Cierra el diálogo
    setTitle("");
    setSubject("");
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">Subir Nuevo Material</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Completa los detalles y selecciona el archivo a subir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right text-card-foreground">
                Título
              </Label>
              <Input 
                id="title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3 bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]" 
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject-upload" className="text-right text-card-foreground">
                Asignatura
              </Label>
              <Select onValueChange={setSubject} value={subject}>
                <SelectTrigger id="subject-upload" className="col-span-3 bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]">
                  <SelectValue placeholder="Selecciona Asignatura" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {allSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file-upload" className="text-right text-card-foreground">
                Archivo
              </Label>
              <Input 
                id="file-upload" 
                type="file" 
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="col-span-3 bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Subir Material</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function StudyMaterialsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | "all">("all");
  const [selectedType, setSelectedType] = useState<string | "all">("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const filteredMaterials = useMemo(() => {
    return placeholderMaterials.filter(material => {
      const matchesSearchTerm = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                material.uploader.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === "all" || material.subject === selectedSubject;
      const matchesType = selectedType === "all" || material.type === selectedType;
      return matchesSearchTerm && matchesSubject && matchesType;
    });
  }, [searchTerm, selectedSubject, selectedType]);

  const handleDownloadMaterial = (title: string) => {
    toast({
      title: "Descargar Material",
      description: `Descargando "${title}"... (simulación)`,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSubject("all");
    setSelectedType("all");
     toast({
      title: "Filtros Limpiados",
      description: "Se han restablecido todos los filtros de búsqueda.",
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Repositorio de Materiales de Estudio</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Accede y comparte materiales de estudio, tutoriales y recursos.
          </p>
        </div>
        <Button variant="default" size="lg" onClick={() => setIsUploadModalOpen(true)}>
          <UploadCloud className="mr-2 h-5 w-5" />
          Subir Material
        </Button>
      </header>

      <Card className="shadow-md bg-card">
        <CardHeader>
          <CardTitle className="text-xl text-primary-foreground">Filtrar y Buscar Materiales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Input 
            type="text" 
            placeholder="Buscar por título o autor..." 
            className="bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={selectedSubject} onValueChange={(value) => setSelectedSubject(value as string | "all")}>
            <SelectTrigger className="bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]">
              <SelectValue placeholder="Filtrar por Asignatura" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todas las Asignaturas</SelectItem>
              {allSubjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as string | "all")}>
            <SelectTrigger className="bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]">
              <SelectValue placeholder="Filtrar por Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todos los Tipos</SelectItem>
              {allTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={clearFilters} className="col-span-1 md:col-span-1">
            <X className="mr-2 h-4 w-4" /> Limpiar Filtros
          </Button>
        </CardContent>
      </Card>
      
      {filteredMaterials.length > 0 ? (
        <Card className="shadow-lg bg-card">
          <CardHeader>
             <CardTitle className="text-primary-foreground">Materiales Disponibles ({filteredMaterials.length})</CardTitle>
             <CardDescription>Explora y descarga recursos de aprendizaje.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Fecha de Subida</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map(material => (
                  <TableRow key={material.id} className="border-border">
                    <TableCell>
                      <material.icon className="h-6 w-6 text-accent" />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{material.title}</TableCell>
                    <TableCell className="text-muted-foreground">{material.subject}</TableCell>
                    <TableCell className="text-muted-foreground">{material.uploader}</TableCell>
                    <TableCell className="text-muted-foreground">{material.uploadDate}</TableCell>
                    <TableCell className="text-muted-foreground">{material.size}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label="Descargar material" onClick={() => handleDownloadMaterial(material.title)}>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Descargar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
         <Card className="shadow-sm bg-card">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Image src="https://placehold.co/400x300.png" alt="No se encontraron materiales" width={200} height={150} className="mx-auto mb-4 rounded" data-ai-hint="empty box dark" />
            <h3 className="text-xl font-semibold mb-2 text-primary-foreground">No Se Encontraron Materiales</h3>
            <p>El repositorio está actualmente vacío o tus filtros no encontraron coincidencias. Intenta ajustar tu búsqueda o vuelve más tarde.</p>
          </CardContent>
        </Card>
      )}
      <UploadMaterialDialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen} />
    </div>
  );
}
