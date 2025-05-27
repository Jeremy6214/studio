
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, CalendarDays, Search, ExternalLink, UserCheck, Sparkles, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SupportProvider {
  id: string;
  name: string;
  avatarUrl: string;
  avatarFallback: string;
  role: "Tutor" | "Estudiante Avanzado";
  expertise: string[];
  availability: string;
  description: string;
}

const placeholderSupport: SupportProvider[] = [
  { id: "1", name: "Oráculo IA", avatarUrl: "https://placehold.co/100x100.png?text=OI", avatarFallback: "OI", role: "Tutor", expertise: ["Modelos Fundacionales", "Ética IA"], availability: "Sesiones Lun-Mié", description: "Tutor experimentado especializado en arquitecturas IA complejas y sus implicaciones." },
  { id: "2", name: "Guardián del Código", avatarUrl: "https://placehold.co/100x100.png?text=GC", avatarFallback: "GC", role: "Tutor", expertise: ["Genkit Avanzado", "Optimización de Flujos"], availability: "Tardes Jue-Vie", description: "Especialista en Genkit enfocado en la eficiencia y escalabilidad de soluciones IA." },
  { id: "3", name: "Sombra Analítica", avatarUrl: "https://placehold.co/100x100.png?text=SA", avatarFallback: "SA", role: "Estudiante Avanzado", expertise: ["Análisis Profundo de Datos", "Visualización"], availability: "Bajo Cita", description: "Estudiante avanzado hábil en extraer ideas de grandes conjuntos de datos." },
  { id: "4", name: "Savant de Sintaxis", avatarUrl: "https://placehold.co/100x100.png?text=SS", avatarFallback: "SS", role: "Estudiante Avanzado", expertise: ["Python & JS", "Depuración"], availability: "Talleres de Fin de Semana", description: "Mentor de pares con habilidad para solucionar problemas y explicar conceptos centrales." },
];

function ProviderProfileDialog({ provider, open, onOpenChange, onContact }: { provider: SupportProvider | null; open: boolean; onOpenChange: (open: boolean) => void; onContact: (name: string) => void }) {
  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="items-center text-center">
           <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={provider.avatarUrl} alt={provider.name} data-ai-hint="person tutor dark" />
            <AvatarFallback>{provider.avatarFallback}</AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl text-primary-foreground">{provider.name}</DialogTitle>
          <DialogDescription className="text-base">
            <span className={`font-semibold ${provider.role === "Tutor" ? 'text-accent' : 'text-secondary-foreground'}`}>
                {provider.role}
            </span>
            {' '}&bull; {provider.expertise.join(", ")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">{provider.description}</p>
            <div className="flex items-center gap-2 text-sm text-card-foreground">
                <CalendarDays className="h-4 w-4 text-accent" />
                <span>Disponibilidad: {provider.availability}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-card-foreground">
                 <Info className="h-4 w-4 text-accent" />
                 <span>Especialidades: {provider.expertise.join(", ")}</span>
            </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button type="button" onClick={() => { onContact(provider.name); onOpenChange(false); }}>
            <Mail className="mr-2 h-4 w-4" /> Contactar a {provider.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestSupportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) {
      toast({
        title: "Error",
        description: "Por favor, completa el asunto y la descripción.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Solicitud de Soporte Enviada (Simulada)",
      description: `Asunto: ${subject}. Tu solicitud ha sido registrada.`,
    });
    onOpenChange(false);
    setSubject("");
    setDescription("");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary-foreground">Solicitar Soporte Específico</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Describe tu necesidad y te conectaremos con la ayuda adecuada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="support-subject" className="text-card-foreground">Asunto de la Solicitud</Label>
              <Input 
                id="support-subject" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]" 
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-description" className="text-card-foreground">Descripción Detallada</Label>
              <Textarea 
                id="support-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]" 
                rows={5}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Enviar Solicitud</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function RecoveryAccessPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportRequestModalOpen, setIsSupportRequestModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<SupportProvider | null>(null);

  const filteredSupport = useMemo(() => {
    if (!searchTerm) return placeholderSupport;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return placeholderSupport.filter(provider => 
      provider.name.toLowerCase().includes(lowerSearchTerm) ||
      provider.role.toLowerCase().includes(lowerSearchTerm) ||
      provider.expertise.some(exp => exp.toLowerCase().includes(lowerSearchTerm))
    );
  }, [searchTerm]);
  
  const handleContact = (name: string) => {
    toast({
      title: "Contactar Soporte (Simulado)",
      description: `Se iniciaría un proceso para contactar a ${name}.`,
    });
  };

  const handleViewProfile = (provider: SupportProvider) => {
    setSelectedProvider(provider);
    setIsProfileModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Acceso de Recuperación</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Conecta con tutores o estudiantes avanzados para apoyo académico y orientación.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Encuentra Apoyo</h2>
        <div className="flex gap-2 items-center">
          <Input 
            type="text" 
            placeholder="Buscar por especialidad, nombre o rol..." 
            className="max-w-sm bg-[hsl(var(--input-bg))] border-[hsl(var(--input-border))]" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline" onClick={() => setSearchTerm("")} disabled={!searchTerm}>
            <Search className="mr-2 h-4 w-4" /> {searchTerm ? "Limpiar" : "Buscar"}
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSupport.map(provider => (
          <Card key={provider.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
            <CardHeader className="flex-row items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={provider.avatarUrl} alt={provider.name} data-ai-hint="person tutor dark" />
                <AvatarFallback>{provider.avatarFallback}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl text-primary-foreground">{provider.name}</CardTitle>
                <CardDescription className="text-sm">
                  <span className={`font-semibold ${provider.role === "Tutor" ? 'text-accent' : 'text-secondary-foreground'}`}>
                    {provider.role}
                  </span>
                   {' '}&bull; {provider.expertise.join(", ")}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{provider.description}</p>
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-accent" />
                <span>{provider.availability}</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="default" size="sm" className="flex-1" onClick={() => handleContact(provider.name)}>
                 {provider.role === "Tutor" ? <UserCheck className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Contactar
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewProfile(provider)}>
                <Mail className="mr-2 h-4 w-4" /> Ver Perfil
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
      {filteredSupport.length === 0 && searchTerm && (
        <Card className="shadow-sm bg-card">
          <CardContent className="p-6 text-center text-muted-foreground">
             <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2 text-primary-foreground">No se encontraron resultados</h3>
            <p>No hay proveedores de soporte que coincidan con "{searchTerm}". Intenta con otros términos.</p>
          </CardContent>
        </Card>
      )}

      <section className="mt-12 p-6 bg-card rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-3 text-primary-foreground">¿Necesitas Ayuda Específica?</h2>
          <p className="text-muted-foreground mb-4">Si no encuentras apoyo adecuado o tienes una consulta específica, envía una solicitud y haremos lo posible por conectarte con la ayuda correcta.</p>
          <Button size="lg" variant="default" onClick={() => setIsSupportRequestModalOpen(true)}>
             Solicitar Soporte <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
      </section>
      <ProviderProfileDialog provider={selectedProvider} open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} onContact={handleContact} />
      <RequestSupportDialog open={isSupportRequestModalOpen} onOpenChange={setIsSupportRequestModalOpen} />
    </div>
  );
}
