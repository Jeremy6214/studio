
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, auth as firebaseAuth } from '@/lib/firebase';
import type { UserProfile } from "@/types/firestore";
import type { User as FirebaseUser } from 'firebase/auth';
import { signOut as firebaseSignOut } from 'firebase/auth'; 
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
  tema: "system", // Default theme
  idioma: "es",   // Default language
  isAdmin: false,
};

export function useFirebaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfileStateInternal] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true); 
  const [userProfileLoading, setUserProfileLoading] = useState(true); 
  const [currentLanguage, setCurrentLanguage] = useState<'es' | 'en'>('es');

  const setUserProfileState = useCallback((profile: UserProfile | null) => {
    setUserProfileStateInternal(profile);
    if (profile) {
      setUser(prevUser => ({
        ...(prevUser || initialSimulatedUserObject),
        uid: profile.uid,
        displayName: profile.nombre || prevUser?.displayName || SIMULATED_USER_DISPLAY_NAME,
        email: profile.correo || prevUser?.email || SIMULATED_USER_EMAIL,
        photoURL: profile.fotoPerfil || prevUser?.photoURL || SIMULATED_USER_PHOTO_FALLBACK,
      }));
      setCurrentLanguage(profile.idioma || 'es');
    } else {
      setUser(initialSimulatedUserObject); 
      setCurrentLanguage('es');
    }
  }, []);


  useEffect(() => {
    setAuthLoading(true);
    setUserProfileLoading(true);
    
    // Simulate user being immediately "authenticated"
    setUser(initialSimulatedUserObject);
    setAuthLoading(false); 

    const profileDocRef = doc(db, "users", SIMULATED_USER_ID);
    
    const unsubscribe = onSnapshot(profileDocRef, 
      async (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setUserProfileState(profileData);
        } else {
          try {
            await setDoc(profileDocRef, initialSimulatedUserProfileObject);
            setUserProfileState(initialSimulatedUserProfileObject);
          } catch (error) {
            console.error("Error creating initial user profile in Firestore:", error);
            toast({ title: "Error de Perfil", description: "No se pudo crear el perfil de usuario inicial.", variant: "destructive"});
            setUserProfileState(initialSimulatedUserProfileObject); 
          }
        }
        setUserProfileLoading(false);
      }, 
      (error) => {
        console.error("Error with profile snapshot from Firestore:", error);
        if (error.message.includes("offline")) {
             toast({ title: "Modo Offline", description: "No se pudo obtener el perfil del usuario. Se usará el perfil local.", variant: "default"});
        } else {
            toast({ title: "Error de Conexión", description: "No se pudo obtener el perfil del usuario. Verifica tu conexión.", variant: "destructive"});
        }
        // Fallback to local default if Firestore is inaccessible
        setUserProfileState(initialSimulatedUserProfileObject);
        setUserProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setUserProfileState]);

  return {
    user,
    authLoading,
    userProfile,
    userProfileLoading,
    setUserProfileState,
    currentLanguage,
  };
}
