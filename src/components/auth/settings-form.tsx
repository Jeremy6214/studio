
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types/firestore";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
// Firebase Auth specific imports like sendPasswordResetEmail are no longer needed.

const settingsFormSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  correo: z.string().email({ message: "Correo no válido." }).optional(), // Correo es solo para mostrar
  fotoPerfil: z.string().url({ message: "Por favor, introduce una URL válida para la foto." }).or(z.literal("")).optional(),
  idioma: z.enum(["es", "en"], { required_error: "Debes seleccionar un idioma." }),
  tema: z.enum(["light", "dark", "system"], { required_error: "Debes seleccionar un tema." }),
  isAdmin: z.boolean().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function SettingsForm() {
  const { user, userProfile, authLoading, userProfileLoading, setUserProfileState } = useFirebaseAuth(); // authLoading might not be as relevant now
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      fotoPerfil: "",
      idioma: "es",
      tema: "system",
      isAdmin: false,
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        nombre: userProfile.nombre || "",
        correo: userProfile.correo || (user?.email ?? ""),
        fotoPerfil: userProfile.fotoPerfil || "",
        idioma: userProfile.idioma || "es",
        tema: userProfile.tema || "system",
        isAdmin: userProfile.isAdmin || false,
      });
    } else if (user && !userProfileLoading && !authLoading) { // If no profile but user exists (simulated)
        form.reset({
            nombre: user.displayName || "",
            correo: user.email || "",
            fotoPerfil: user.photoURL || "",
            idioma: "es", // Default if profile is missing
            tema: "system", // Default if profile is missing
            isAdmin: false, // Default if profile is missing
        });
    }
  }, [userProfile, user, form, userProfileLoading, authLoading]);

  async function onSubmit(data: SettingsFormValues) {
    if (!user || !user.uid) { // user.uid is now always "uid_test"
      toast({ title: "Error", description: "No se pudo identificar al usuario simulado.", variant: "destructive" });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid); // user.uid will be "uid_test"
      
      const updatedProfileData: Partial<UserProfile> = {
        uid: user.uid, // Ensure UID is part of the data being set
        nombre: data.nombre,
        correo: user.email, // Keep the simulated email or the one from userProfile
        fotoPerfil: data.fotoPerfil,
        idioma: data.idioma,
        tema: data.tema,
        isAdmin: data.isAdmin,
      };

      await setDoc(userDocRef, updatedProfileData, { merge: true });
      
      setUserProfileState({ ...userProfile, ...updatedProfileData } as UserProfile);


      if (data.tema) {
        if (typeof window !== 'undefined') {
            document.documentElement.classList.remove("light", "dark");
            if (data.tema === "dark") {
            document.documentElement.classList.add("dark");
            } else if (data.tema === "light") {
            document.documentElement.classList.add("light");
            } else { 
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            }
            localStorage.setItem("theme", data.tema);
        }
      }
      if (data.idioma) {
        if (typeof window !== 'undefined') {
            localStorage.setItem("language", data.idioma);
        }
      }

      toast({ title: "Configuración Guardada", description: "Tus preferencias han sido actualizadas." });
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof Error && error.message.includes('offline')) {
        toast({ title: "Modo Offline", description: "Cambios guardados localmente. Se sincronizarán con la nube al reconectar.", variant: "default"});
      } else {
        toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
      }
    }
  }

  const handlePasswordReset = () => {
    // Since Firebase Auth is removed, this is purely simulated.
    toast({ title: "Cambio de Contraseña (Simulado)", description: "En una aplicación real, aquí se iniciaría el proceso de cambio de contraseña." });
  };

  if (authLoading || userProfileLoading) {
    return <p>Cargando configuración...</p>;
  }

  if (!user) {
    // This case should ideally not be reached with the simulated user
    return <p>Error al cargar la información del usuario simulado.</p>; 
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de Usuario</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="correo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input placeholder="tu@correo.com" {...field} disabled />
              </FormControl>
              <FormDescription>El correo electrónico es parte del usuario simulado y no se puede cambiar.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fotoPerfil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Foto de Perfil</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/foto.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="button" variant="outline" onClick={handlePasswordReset}>
          Cambiar Contraseña (Simulado)
        </Button>

        <FormField
          control={form.control}
          name="idioma"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma de la Aplicación</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tema"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tema Visual</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="light" />
                    </FormControl>
                    <FormLabel className="font-normal">Claro</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="dark" />
                    </FormControl>
                    <FormLabel className="font-normal">Oscuro</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="system" />
                    </FormControl>
                    <FormLabel className="font-normal">Automático (Sistema)</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAdmin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Habilitar Privilegios de Administrador (Pruebas)
                </FormLabel>
                <FormDescription>
                  Permite realizar acciones de administrador para pruebas.
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

        <Button type="submit">Guardar Configuración</Button>
      </form>
    </Form>
  );
}
