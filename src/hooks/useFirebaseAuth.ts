
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types/firestore';

// Definimos una interfaz 'User' simplificada para el usuario simulado
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean; // Aunque lo pongamos a false, lo mantenemos por si se usa en otros sitios
  userId: string | null;
  userProfile: UserProfile | null;
  setUserProfileState: (profile: UserProfile | null) => void;
}

const SIMULATED_USER_ID = "uid_test";
const SIMULATED_USER_DISPLAY_NAME = "Estudiante de Pruebas";
const SIMULATED_USER_EMAIL = "uid_test@example.com";
const SIMULATED_USER_PHOTO_FALLBACK = `https://placehold.co/40x40.png?text=ET`;

const initialSimulatedUser: User = {
  uid: SIMULATED_USER_ID,
  displayName: SIMULATED_USER_DISPLAY_NAME,
  email: SIMULATED_USER_EMAIL,
  photoURL: SIMULATED_USER_PHOTO_FALLBACK,
};

const initialSimulatedUserProfile: UserProfile = {
  uid: SIMULATED_USER_ID,
  nombre: SIMULATED_USER_DISPLAY_NAME,
  correo: SIMULATED_USER_EMAIL,
  fotoPerfil: SIMULATED_USER_PHOTO_FALLBACK,
  tema: "system",
  idioma: "es",
  isAdmin: false, 
};

export function useFirebaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(initialSimulatedUser);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialSimulatedUserProfile);
  const [loading, setLoading] = useState(false); // Iniciar como false

  const setUserProfileState = useCallback((profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile && user) {
      setUser(prevUser => ({
        ...prevUser!,
        displayName: profile.nombre || prevUser!.displayName,
        photoURL: profile.fotoPerfil || prevUser!.photoURL,
      }));
    }
  }, [user]);

  useEffect(() => {
    // Aunque ya tenemos valores iniciales, escuchamos a Firestore para cualquier actualización
    // o para crear el perfil si es la primera vez.
    const profileDocRef = doc(db, "users", SIMULATED_USER_ID);
    
    const unsubscribe = onSnapshot(profileDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setUserProfile(profileData); // Actualiza el perfil local con datos de Firestore
        // Actualiza los detalles del objeto 'user' basado en el perfil de Firestore
        setUser(prevUser => ({
          ...prevUser!,
          displayName: profileData.nombre || initialSimulatedUser.displayName,
          photoURL: profileData.fotoPerfil || initialSimulatedUser.photoURL,
        }));
      } else {
        // El perfil no existe en Firestore, creamos uno con los valores iniciales/por defecto
        // Esto asegura que el perfil se cree en Firestore si aún no existe
        try {
          await setDoc(profileDocRef, initialSimulatedUserProfile);
          setUserProfile(initialSimulatedUserProfile); // Establece el perfil local
           setUser(prevUser => ({ // Asegura que el user object también refleje esto
            ...prevUser!,
            displayName: initialSimulatedUserProfile.nombre,
            photoURL: initialSimulatedUserProfile.fotoPerfil,
          }));
        } catch (error) {
          console.error("Error creating default user profile in Firestore:", error);
        }
      }
      // setLoading(false); // Ya es false, pero lo dejamos por si se cambia la lógica inicial
    }, (error) => {
      console.error("Error fetching user profile from Firestore:", error);
      // Mantenemos el perfil local simulado y loading como false
      // setLoading(false);
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar

  }, []); // Ejecutar solo una vez al montar para configurar el listener

  return { 
    user, 
    loading, 
    userId: user ? user.uid : null, 
    userProfile,
    setUserProfileState 
  };
}
