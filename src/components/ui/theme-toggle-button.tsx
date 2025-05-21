
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"; // Importar hook
import { doc, updateDoc } from "firebase/firestore"; // Importar firestore
import { db } from "@/lib/firebase"; // Importar db

type Theme = "light" | "dark" | "system";

export function ThemeToggleButton() {
  const { user, userProfile } = useFirebaseAuth(); // Usar hook
  const { toast } = useToast();
  // El estado local del tema no es necesario aquí si AppLayout lo maneja centralmente
  // y este botón solo alterna y guarda.

  const applyTheme = React.useCallback((themeToApply: Theme) => {
    document.documentElement.classList.remove("light", "dark");
    if (themeToApply === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeToApply === "light") {
      document.documentElement.classList.add("light");
    } else { // system
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        // No es necesario remover 'dark' si no está, y 'light' no es una clase que añadamos por defecto.
        // El CSS base debe manejar el tema claro.
      }
    }
  }, []);

  const toggleThemeAndPersist = async () => {
    const currentStoredTheme = localStorage.getItem("theme") as Theme || "system";
    let newTheme: Theme;

    // Determinar el tema actual efectivo
    let currentEffectiveTheme: 'light' | 'dark';
    if (currentStoredTheme === 'system') {
      currentEffectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
    } else {
      currentEffectiveTheme = currentStoredTheme;
    }
    
    // Alternar
    newTheme = currentEffectiveTheme === 'dark' ? 'light' : 'dark';

    applyTheme(newTheme); // Aplicar visualmente
    localStorage.setItem("theme", newTheme); // Guardar en localStorage

    toast({ title: `Tema cambiado a ${newTheme === 'dark' ? 'Oscuro' : 'Claro'}` });

    if (user && user.uid) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { tema: newTheme });
      } catch (error) {
        console.error("Error updating theme in Firestore:", error);
        toast({ title: "Error", description: "No se pudo guardar el tema en la nube.", variant: "destructive" });
      }
    }
  };
  
  // No es necesario el useEffect para setear el tema inicial aquí, 
  // AppLayout se encarga de eso al cargar la página.

  return (
    <Button variant="ghost" size="icon" onClick={toggleThemeAndPersist} aria-label="Toggle theme" className="text-foreground hover:text-accent-foreground hover:bg-accent">
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
