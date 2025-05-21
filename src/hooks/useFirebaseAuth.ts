
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
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
  loading: boolean;
  userId: string | null;
  userProfile: UserProfile | null;
  setUserProfileState: (profile: UserProfile | null) => void;
}

const SIMULATED_USER_ID = "uid_test";
const SIMULATED_USER_DISPLAY_NAME = "Estudiante de Pruebas";
const SIMULATED_USER_EMAIL = "test@example.com";
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
  idioma: "es",    // Default language
  isAdmin: false,
};

export function useFirebaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null); // Start as null
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Start as null
  const [loading, setLoading] = useState(true); // Start as true

  const setUserProfileState = useCallback((profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile) {
      setUser(prevUser => ({
        ...(prevUser || initialSimulatedUserObject), // Ensure prevUser exists or use initial
        uid: profile.uid, 
        displayName: profile.nombre || prevUser?.displayName || SIMULATED_USER_DISPLAY_NAME,
        email: profile.correo || prevUser?.email || SIMULATED_USER_EMAIL,
        photoURL: profile.fotoPerfil || prevUser?.photoURL || SIMULATED_USER_PHOTO_FALLBACK,
      }));
    } else {
      // If profile is cleared, set user to initial simulated user for consistency
      setUser(initialSimulatedUserObject);
    }
  }, []);


  useEffect(() => {
    // This effect runs only on the client after mount
    // Set the simulated user details first
    setUser(initialSimulatedUserObject);

    const profileDocRef = doc(db, "users", SIMULATED_USER_ID);
    const unsubscribe = onSnapshot(profileDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setUserProfileState(profileData); 
      } else {
        try {
          await setDoc(profileDocRef, initialSimulatedUserProfileObject);
          setUserProfileState(initialSimulatedUserProfileObject);
        } catch (error) {
          console.error("Error creating/setting default user profile in Firestore:", error);
          setUserProfileState(initialSimulatedUserProfileObject); // Fallback to local object
        }
      }
      setLoading(false); 
    }, (error) => {
      console.error("Error fetching user profile from Firestore:", error);
      setUser(initialSimulatedUserObject); // Ensure user is set even on error
      setUserProfileState(initialSimulatedUserProfileObject); // Fallback to local object
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUserProfileState]);

  return {
    user,
    loading,
    userId: user ? user.uid : null,
    userProfile,
    setUserProfileState,
  };
}
