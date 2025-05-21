
"use client";

import * as React from "react";
import { Moon, Sun, MonitorSmartphone } from "lucide-react"; // Added MonitorSmartphone for system
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"; 
import { doc, updateDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

export function ThemeToggleButton() {
  const { user, userProfile, setUserProfileState } = useFirebaseAuth(); 
  const { toast } = useToast();
  const [currentTheme, setCurrentTheme] = React.useState<Theme>("system");
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = userProfile?.tema || storedTheme || "system";
    setCurrentTheme(initialTheme);
    applyThemeToDocument(initialTheme);
  }, [userProfile?.tema]); // Rerun if theme from profile changes

  const applyThemeToDocument = (theme: Theme) => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  const setTheme = async (theme: Theme) => {
    if (!hasMounted) return;

    setCurrentTheme(theme);
    applyThemeToDocument(theme);
    localStorage.setItem("theme", theme);

    let themeNameToast = "";
    if (theme === 'light') themeNameToast = "Claro";
    else if (theme === 'dark') themeNameToast = "Oscuro";
    else themeNameToast = "Automático (Sistema)";

    toast({ title: `Interfaz actualizada a tema ${themeNameToast}` });

    if (user && user.uid) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { tema: theme });
        if (userProfile) {
          setUserProfileState({ ...userProfile, tema: theme });
        }
      } catch (error) {
        console.error("Error updating theme in Firestore:", error);
        toast({ title: "Error de Sincronización", description: "No se pudo guardar el tema en la nube.", variant: "destructive" });
      }
    }
  };
  
  if (!hasMounted) { // Avoid rendering mismatch during hydration
    return <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-full h-10 w-10" disabled><MonitorSmartphone className="h-5 w-5" /></Button>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-full h-10 w-10 hover:scale-110 transition-transform">
          {currentTheme === "light" && <Sun className="h-5 w-5 transition-all" />}
          {currentTheme === "dark" && <Moon className="h-5 w-5 transition-all" />}
          {currentTheme === "system" && <MonitorSmartphone className="h-5 w-5 transition-all" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border shadow-xl">
        <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-accent cursor-pointer gap-2">
          <Sun className="h-4 w-4 mr-1" /> Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-accent cursor-pointer gap-2">
          <Moon className="h-4 w-4 mr-1" /> Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-accent cursor-pointer gap-2">
          <MonitorSmartphone className="h-4 w-4 mr-1" /> Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
