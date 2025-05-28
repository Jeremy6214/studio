
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // firebaseAuth (actual Auth instance) is no longer imported
import type { UserProfile } from "@/types/firestore";
// FirebaseUser and firebaseSignOut are no longer imported
import { toast } from '@/hooks/use-toast';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: User | null;
  authLoading: boolean; 
  userProfile: UserProfile | null;
  userProfileLoading: boolean; 
  setUserProfileState: (profile: UserProfile | null) => void;
  currentLanguage: 'es' | 'en';
}

const SIMULATED_USER_ID = "uid_test";
const SIMULATED_USER_DISPLAY_NAME = "Estudiante de Pruebas";
const SIMULATED_USER_EMAIL = "test@darkaischool.tech";
const SIMULATED_USER_PHOTO_FALLBACK = `https://placehold.co/40x40.png?text=ET`;

const initialSimulatedUserObject: User = {
  uid: SIMULATED_USER_ID,
  displayName: SIMULATED_USER_DISPLAY_NAME,
  email: SIMULATED_USER_EMAIL,
  photoURL: SIMULATED_USER_PHOTO_FALLBACK,
};

const initialSimulatedUserProfileObject: UserProfile = {
  uid: SIMULATED_USER_ID,
  nombre: SIMULATED_USER_DISPLAY_NAME,
  correo: SIMULATED_USER_EMAIL,
  fotoPerfil: SIMULATED_USER_PHOTO_FALLBACK,
  tema: "system",
  idioma: "es",
  isAdmin: false,
};

export function useFirebaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null); // Initialize as null
  const [userProfile, setUserProfileStateInternal] = useState<UserProfile | null>(null); // Initialize as null
  const [authLoading, setAuthLoading] = useState(true); 
  const [userProfileLoading, setUserProfileLoading] = useState(true); 
  const [currentLanguage, setCurrentLanguage] = useState<'es' | 'en'>('es');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const setUserProfileState = useCallback((profile: UserProfile | null) => {
    setUserProfileStateInternal(profile);
    if (profile) {
      // Update the simulated user object based on the profile
      setUser({
        uid: profile.uid,
        displayName: profile.nombre || SIMULATED_USER_DISPLAY_NAME,
        email: profile.correo || SIMULATED_USER_EMAIL,
        photoURL: profile.fotoPerfil || SIMULATED_USER_PHOTO_FALLBACK,
      });
      setCurrentLanguage(profile.idioma || 'es');
    } else {
      // Fallback to initial simulated user if profile is null
      setUser(initialSimulatedUserObject);
      setCurrentLanguage('es');
    }
  }, []);

  useEffect(() => {
    if (!hasMounted) return; // Only run on client

    // Simulate user being "authenticated" immediately on client mount
    setUser(initialSimulatedUserObject);
    setAuthLoading(false); 
    setUserProfileLoading(true); // Start loading profile from Firestore

    const profileDocRef = doc(db, "users", SIMULATED_USER_ID);
    
    const unsubscribe = onSnapshot(profileDocRef, 
      async (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setUserProfileState(profileData);
        } else {
          // Profile doesn't exist, create it with defaults
          try {
            await setDoc(profileDocRef, initialSimulatedUserProfileObject);
            setUserProfileState(initialSimulatedUserProfileObject);
            toast({ title: "Perfil Creado", description: "Se ha creado un perfil de prueba en Firestore."});
          } catch (error) {
            console.error("Error creating initial user profile in Firestore:", error);
            if (error instanceof Error && error.message.includes('offline')) {
              toast({ title: "Modo Offline", description: "No se pudo crear el perfil inicial. Se usarán valores por defecto.", variant: "default"});
            } else {
              toast({ title: "Error de Perfil", description: "No se pudo crear el perfil de usuario inicial.", variant: "destructive"});
            }
            setUserProfileState(initialSimulatedUserProfileObject); // Fallback to local default
          }
        }
        setUserProfileLoading(false);
      }, 
      (error) => {
        console.error("Error with profile snapshot from Firestore:", error);
        if (error.message.includes("offline")) {
             toast({ title: "Modo Offline", description: "No se pudo obtener el perfil del usuario. Se usarán valores por defecto.", variant: "default"});
        } else {
            toast({ title: "Error de Conexión", description: "No se pudo obtener el perfil del usuario. Verifica tu conexión.", variant: "destructive"});
        }
        setUserProfileState(initialSimulatedUserProfileObject); // Fallback to local default
        setUserProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hasMounted, setUserProfileState]); // Added setUserProfileState to dependencies

  return {
    user,
    authLoading,
    userProfile,
    userProfileLoading,
    setUserProfileState,
    currentLanguage,
  };
}
