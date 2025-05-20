
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
import { User, Mail, Lock, Image as ImageIcon, Palette, Languages, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Mock Firebase Auth & Firestore interactions
// In a real app, you'd use Firebase SDK here.
// Example: import { getAuth, updateProfile, updatePassword, updateEmail } from "firebase/auth";
// Example: import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const settingsFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Correo electrónico no válido." }),
  photoURL: z.string().url({ message: "URL de imagen no válida." }).or(z.literal("")),
  language: z.enum(["es", "en"], { message: "Debes seleccionar un idioma." }),
  theme: z.enum(["system", "light", "dark"], { message: "Debes seleccionar un tema." }),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// Mock current user data - in a real app, this would come from Firebase Auth/Firestore
const mockCurrentUser = {
  uid: "mockUserId123",
  name: "John Doe",
  email: "john.doe@example.com",
  photoURL: "https://placehold.co/100x100.png",
};

const mockUserPreferences = {
  language: "es" as "es" | "en",
  theme: "system" as "system" | "light" | "dark",
};

export function SettingsForm() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(mockCurrentUser); // Replace with actual auth state
  const [userPreferences, setUserPreferences] = useState(mockUserPreferences); // Replace with Firestore data

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: currentUser.name || "",
      email: currentUser.email || "",
      photoURL: currentUser.photoURL || "",
      language: userPreferences.language || "es",
      theme: userPreferences.theme || "system",
    },
  });
  
  // Effect to reset form if currentUser or userPreferences change (e.g., after fetching from Firebase)
  useEffect(() => {
    form.reset({
      name: currentUser.name || "",
      email: currentUser.email || "",
      photoURL: currentUser.photoURL || "",
      language: userPreferences.language || "es",
      theme: userPreferences.theme || "system",
    });
  }, [currentUser, userPreferences, form]);


  const handleChangePassword = () => {
    // const auth = getAuth();
    // const user = auth.currentUser;
    // if (user) { /* Send password reset email or navigate to change password flow */ }
    toast({
      title: "Cambiar Contraseña",
      description: "Funcionalidad de cambio de contraseña no implementada en esta demo. Se enviaría un correo de restablecimiento.",
      variant: "default",
    });
  };

  // Handle theme change and apply it
  const handleThemeChange = (themeValue: "system" | "light" | "dark") => {
    localStorage.setItem("themeSetting", themeValue); // Store user's explicit choice
    if (themeValue === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else if (themeValue === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else { // System
      localStorage.removeItem("theme"); // Let browser/OS decide based on 'prefers-color-scheme'
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };


  async function onSubmit(data: SettingsFormValues) {
    toast({
      title: "Guardando Configuración...",
      description: "Tus cambios están siendo procesados.",
    });

    try {
      // Simulate Firebase Auth update for name and photoURL
      // const auth = getAuth();
      // if (auth.currentUser) {
      //   await updateProfile(auth.currentUser, { displayName: data.name, photoURL: data.photoURL });
      // }
      setCurrentUser(prev => ({ ...prev, name: data.name, photoURL: data.photoURL }));
      
      // Simulate Firestore update for preferences
      // const db = getFirestore();
      // const userPrefsRef = doc(db, "userPreferences", auth.currentUser.uid);
      // await setDoc(userPrefsRef, { language: data.language, theme: data.theme }, { merge: true });
      setUserPreferences({ language: data.language, theme: data.theme });

      // Apply theme immediately
      handleThemeChange(data.theme);
      
      // Simulate language change (in a real app, this would involve i18n context/library)
      localStorage.setItem("language", data.language);
      // Force a reload or update context to reflect language changes globally
      // For this demo, we'll just show a toast.
      toast({
        title: "Configuración Guardada",
        description: "Tus preferencias han sido actualizadas. El cambio de idioma completo requiere recargar la aplicación o un sistema i18n.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error al Guardar",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={form.watch("photoURL") || "https://placehold.co/100x100.png?text=JD"} alt={form.watch("name")} data-ai-hint="user avatar placeholder" />
            <AvatarFallback>{form.watch("name")?.substring(0,2).toUpperCase() || "JD"}</AvatarFallback>
          </Avatar>
          <FormField
            control={form.control}
            name="photoURL"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />URL de Foto de Perfil</FormLabel>
                <FormControl>
                  <Input placeholder="https://ejemplo.com/imagen.png" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Correo Electrónico</FormLabel>
              <FormControl>
                <Input placeholder="tu@correo.com" {...field} disabled />
              </FormControl>
              <FormDescription>
                El correo electrónico no se puede cambiar directamente aquí. Para cambios, contacta al soporte.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Contraseña</FormLabel>
          <Button type="button" variant="outline" onClick={handleChangePassword}>
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
          name="theme"
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
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma de la Aplicación</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <Button type="submit" size="lg">
          <Save className="mr-2 h-4 w-4" /> Guardar Cambios
        </Button>
      </form>
    </Form>
  );
}
