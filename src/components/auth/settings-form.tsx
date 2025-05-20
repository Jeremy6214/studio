
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Lock, Image as ImageIcon, Palette, Languages, Save, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { updateProfile, User as FirebaseUser, sendPasswordResetEmail } from "firebase/auth";
import type { UserProfile } from "@/types/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch"; // Import Switch

const settingsFormSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).max(50, { message: "El nombre no puede exceder los 50 caracteres."}),
  fotoPerfil: z.string().url({ message: "URL de imagen no válida." }).or(z.literal("").optional()),
  idioma: z.enum(["es", "en"], { required_error: "Debes seleccionar un idioma." }),
  tema: z.enum(["system", "light", "dark"], { required_error: "Debes seleccionar un tema." }),
  isAdmin: z.boolean().optional(), // Nuevo campo
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface SettingsFormProps {
  currentUser: FirebaseUser;
}

export function SettingsForm({ currentUser }: SettingsFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [initialPhotoURL, setInitialPhotoURL] = useState(currentUser.photoURL || "");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);


  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: async () => {
      setIsLoading(true);
      try {
        const userDocRef = doc(db, "usuarios", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let dbProfile: UserProfile | null = null;
        if (userDocSnap.exists()) {
          dbProfile = userDocSnap.data() as UserProfile;
          setUserProfile(dbProfile);
        }
        setInitialPhotoURL(currentUser.photoURL || dbProfile?.fotoPerfil || "");
        return {
          nombre: currentUser.displayName || dbProfile?.nombre || "",
          fotoPerfil: currentUser.photoURL || dbProfile?.fotoPerfil || "",
          idioma: dbProfile?.idioma || "es",
          tema: dbProfile?.tema || "system",
          isAdmin: dbProfile?.isAdmin || false,
        };
      } catch (error) {
        console.error("Error fetching user defaults:", error);
        toast({ title: "Error", description: "No se pudieron cargar tus datos.", variant: "destructive" });
        return { 
          nombre: currentUser.displayName || "",
          fotoPerfil: currentUser.photoURL || "",
          idioma: "es",
          tema: "system",
          isAdmin: false,
        };
      } finally {
        setIsLoading(false);
      }
    },
  });
  
  useEffect(() => {
    // Initialize theme from localStorage or form default
    const themeValueFromForm = form.getValues("tema");
    const storedThemeSetting = localStorage.getItem("themeSetting") as SettingsFormValues["tema"] || themeValueFromForm;
    if (storedThemeSetting !== themeValueFromForm) {
        form.setValue("tema", storedThemeSetting);
    }
    handleThemeChange(storedThemeSetting, false);

    // Initialize language from localStorage or form default
    const languageValueFromForm = form.getValues("idioma");
    const storedLanguage = localStorage.getItem("language") as SettingsFormValues["idioma"] || languageValueFromForm;
     if (storedLanguage !== languageValueFromForm) {
        form.setValue("idioma", storedLanguage);
    }
    // Optionally dispatch language change event if needed by AppLayout here
  }, [form]);


  const handleChangePassword = async () => {
    if (!currentUser.email) {
      toast({ title: "Error", description: "No hay correo electrónico asociado a esta cuenta.", variant: "destructive" });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      toast({
        title: "Correo Enviado",
        description: "Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.",
      });
    } catch (error: any) {
      toast({
        title: "Error al enviar correo",
        description: error.message || "No se pudo enviar el correo de restablecimiento.",
        variant: "destructive",
      });
    }
  };
  
  const handleThemeChange = (themeValue: "system" | "light" | "dark", showToast: boolean = true) => {
    localStorage.setItem("themeSetting", themeValue); 
    let appliedTheme: 'light' | 'dark';

    if (themeValue === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light"); 
      appliedTheme = 'light';
    } else if (themeValue === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      appliedTheme = 'dark';
    } else { 
      localStorage.removeItem("theme"); 
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
        appliedTheme = 'dark';
      } else {
        document.documentElement.classList.remove("dark");
        appliedTheme = 'light';
      }
    }
     if (showToast) {
      toast({ title: `Tema ${appliedTheme === 'dark' ? 'Oscuro' : 'Claro'} Activado` });
    }
  };


  async function onSubmit(data: SettingsFormValues) {
    setIsLoading(true);
    toast({
      title: "Guardando Configuración...",
      description: "Tus cambios están siendo procesados.",
    });

    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: data.nombre,
          photoURL: data.fotoPerfil || null, 
        });
      } else {
        throw new Error("Usuario no autenticado.");
      }

      const userDocRef = doc(db, "usuarios", currentUser.uid);
      const userProfileData: UserProfile = { 
        uid: currentUser.uid,
        nombre: data.nombre,
        correo: currentUser.email || "", 
        fotoPerfil: data.fotoPerfil || "",
        idioma: data.idioma,
        tema: data.tema,
        isAdmin: data.isAdmin || false, // Guardar el estado de isAdmin
      };
      await setDoc(userDocRef, userProfileData, { merge: true });
      
      setUserProfile(userProfileData); // Actualizar el estado local del perfil
      setInitialPhotoURL(data.fotoPerfil || ""); 

      handleThemeChange(data.tema, false); 
      localStorage.setItem("language", data.idioma);
      
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('languageChange', { detail: data.idioma }));
      }
      
      toast({
        title: "Configuración Guardada",
        description: "Tus preferencias han sido actualizadas con éxito.",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error al Guardar",
        description: error.message || "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (form.formState.isLoading || isLoading) { 
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-grow space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Separator />
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-1/4 mb-2 mt-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-1/3 mt-2" />
        <Separator />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-10 w-full" />
        <Separator />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-10 w-full" />
        <Button size="lg" disabled className="mt-4">
          <Save className="mr-2 h-4 w-4" /> Guardando...
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={form.watch("fotoPerfil") || initialPhotoURL || "https://placehold.co/100x100.png?text=U"} alt={form.watch("nombre")} data-ai-hint="user avatar placeholder" />
            <AvatarFallback>{form.watch("nombre")?.substring(0,2).toUpperCase() || currentUser.email?.substring(0,2).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <FormField
            control={form.control}
            name="fotoPerfil"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />URL de Foto de Perfil</FormLabel>
                <FormControl>
                  <Input placeholder="https://ejemplo.com/imagen.png" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Correo Electrónico</FormLabel>
          <FormControl>
            <Input placeholder="tu@correo.com" value={currentUser.email || ""} disabled />
          </FormControl>
          <FormDescription>
            El correo electrónico no se puede cambiar directamente aquí.
          </FormDescription>
        </FormItem>
        
        <FormItem>
          <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Contraseña</FormLabel>
          <Button type="button" variant="outline" onClick={handleChangePassword} disabled={isLoading}>
            Cambiar Contraseña
          </Button>
          <FormDescription>
            Se enviará un enlace para restablecer tu contraseña a tu correo electrónico.
          </FormDescription>
        </FormItem>

        <Separator />
        <h3 className="text-lg font-medium flex items-center"><Palette className="mr-2 h-5 w-5 text-muted-foreground" />Preferencias de Visualización</h3>

        <FormField
          control={form.control}
          name="tema"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tema Visual</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleThemeChange(value as "system" | "light" | "dark");
                  }}
                  value={field.value}
                  className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="light" />
                    </FormControl>
                    <FormLabel className="font-normal">Claro</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="dark" />
                    </FormControl>
                    <FormLabel className="font-normal">Oscuro</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="system" />
                    </FormControl>
                    <FormLabel className="font-normal">Sistema</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        <h3 className="text-lg font-medium flex items-center"><Languages className="mr-2 h-5 w-5 text-muted-foreground" />Preferencias de Idioma</h3>

        <FormField
          control={form.control}
          name="idioma"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma de la Aplicación</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  localStorage.setItem("language", value);
                   if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('languageChange', { detail: value }));
                  }
                  toast({ title: `Idioma cambiado a ${value === 'es' ? 'Español' : 'English'}` });
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un idioma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Esto cambiará el idioma de la interfaz de usuario.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        <h3 className="text-lg font-medium flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-muted-foreground" />Modo Administrador (Pruebas)</h3>
        <FormField
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                <div className="space-y-0.5">
                    <FormLabel>Habilitar Privilegios de Administrador (Pruebas)</FormLabel>
                    <FormDescription>
                    Activa esto para simular permisos de administrador en los foros (ej. eliminar cualquier post/comentario).
                    </FormDescription>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
        />


        <Button type="submit" size="lg" disabled={isLoading || form.formState.isSubmitting}>
          <Save className="mr-2 h-4 w-4" /> {isLoading || form.formState.isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </Form>
  );
}
