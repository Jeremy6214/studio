
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
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Asegúrate que db esté exportado
// No se usa sendPasswordResetEmail ni auth directamente aquí, se simula
// import { sendPasswordResetEmail, updateProfile as updateAuthProfile } from "firebase/auth";
// import { auth } from "@/lib/firebase";

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
  const { user, userProfile, loading, setUserProfileState } = useFirebaseAuth();
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
    } else if (user && !loading) { // Si no hay perfil pero sí usuario, inicializar con datos del usuario
        form.reset({
            nombre: user.displayName || "",
            correo: user.email || "",
            fotoPerfil: user.photoURL || "",
            idioma: "es",
            tema: "system",
            isAdmin: false,
        });
    }
  }, [userProfile, user, form, loading]);

  async function onSubmit(data: SettingsFormValues) {
    if (!user || !user.uid) {
      toast({ title: "Error", description: "No se pudo identificar al usuario.", variant: "destructive" });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      
      const updatedProfileData: Partial<UserProfile> = {
        nombre: data.nombre,
        // correo: data.correo, // No se actualiza el correo directamente aquí para evitar complejidad con verificación de Firebase Auth
        fotoPerfil: data.fotoPerfil,
        idioma: data.idioma,
        tema: data.tema,
        isAdmin: data.isAdmin,
      };

      // Actualizar o crear el documento en Firestore
      await setDoc(userDocRef, updatedProfileData, { merge: true });
      
      // Actualizar estado local
      if (userProfile) {
        setUserProfileState({ ...userProfile, ...updatedProfileData } as UserProfile);
      } else {
         // If userProfile was null, construct a new one
        const baseProfile = await getDoc(userDocRef);
        if(baseProfile.exists()){
            setUserProfileState(baseProfile.data() as UserProfile);
        }
      }


      // Simular actualización de perfil de Firebase Auth (nombre, foto)
      // En una app real, esto sería:
      // if (auth.currentUser) {
      //   await updateAuthProfile(auth.currentUser, { displayName: data.nombre, photoURL: data.fotoPerfil });
      // }
      // Por ahora, ya se actualiza en el hook useFirebaseAuth al leer de Firestore.

      // Aplicar tema e idioma inmediatamente si es necesario
      if (data.tema) {
        document.documentElement.classList.remove("light", "dark");
        if (data.tema === "dark") {
          document.documentElement.classList.add("dark");
        } else if (data.tema === "light") {
          document.documentElement.classList.add("light");
        } else { // system
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        localStorage.setItem("theme", data.tema);
      }
      if (data.idioma) {
        localStorage.setItem("language", data.idioma);
        // Aquí podrías llamar a una función para recargar/actualizar textos si tienes i18n
      }

      toast({ title: "Configuración Guardada", description: "Tus preferencias han sido actualizadas." });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    }
  }

  const handlePasswordReset = async () => {
    if (user && user.email) {
      // Simulación de envío de correo. En una app real:
      // try {
      //   await sendPasswordResetEmail(auth, user.email);
      //   toast({ title: "Correo Enviado", description: "Se ha enviado un enlace para restablecer tu contraseña a tu correo." });
      // } catch (error) {
      //   console.error("Error sending password reset email:", error);
      //   toast({ title: "Error", description: "No se pudo enviar el correo de restablecimiento.", variant: "destructive" });
      // }
      toast({ title: "Restablecimiento de Contraseña (Simulado)", description: `Se simula el envío de un correo a ${user.email}.` });
    } else {
      toast({ title: "Error", description: "No se encontró un correo para el usuario.", variant: "destructive" });
    }
  };

  if (loading) {
    return <p>Cargando configuración...</p>;
  }

  if (!user) {
    // Esto no debería pasar con el hook simulado, pero es buena práctica
    return <p>Por favor, inicia sesión para ver la configuración.</p>; 
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
              <FormDescription>El correo electrónico no se puede cambiar desde aquí.</FormDescription>
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
