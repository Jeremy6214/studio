
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming db is exported from firebase.ts
import type { UserProfile } from '@/types/firestore';

// Simulamos una interfaz de usuario más completa por si algún componente aún la espera
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  // Firebase User object often has more, but these are common
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  userId: string | null;
  userProfile: UserProfile | null; // Added userProfile
  setUserProfileState: (profile: UserProfile | null) => void; // For local updates
}

const SIMULATED_USER_ID = "uid_test";
const SIMULATED_USER_PHOTO_PLACEHOLDER = `https://placehold.co/40x40.png?text=${SIMULATED_USER_ID.substring(0,2).toUpperCase()}`;

export function useFirebaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const simulatedUser: User = {
    uid: SIMULATED_USER_ID,
    displayName: "Estudiante de Pruebas",
    email: "uid_test@example.com",
    photoURL: SIMULATED_USER_PHOTO_PLACEHOLDER,
  };

  const setUserProfileState = useCallback((profile: UserProfile | null) => {
    setUserProfile(profile);
  }, []);

  useEffect(() => {
    // Simulate authentication
    setUser(simulatedUser);
    setLoading(false);

    // Fetch or create user profile from Firestore
    const profileDocRef = doc(db, "users", SIMULATED_USER_ID);
    
    const unsubscribe = onSnapshot(profileDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setUserProfile(profileData);
        // Update simulated user details if profile has them
        setUser(prevUser => ({
          ...prevUser!,
          displayName: profileData.nombre || prevUser!.displayName,
          photoURL: profileData.fotoPerfil || prevUser!.photoURL,
        }));
      } else {
        // Profile doesn't exist, create a default one
        const defaultProfile: UserProfile = {
          uid: SIMULATED_USER_ID,
          nombre: simulatedUser.displayName || "Usuario de Prueba",
          correo: simulatedUser.email || "test@example.com",
          fotoPerfil: simulatedUser.photoURL || SIMULATED_USER_PHOTO_PLACEHOLDER,
          tema: "system", // Default theme
          idioma: "es", // Default language
          isAdmin: false, // Default admin status
        };
        try {
          await setDoc(profileDocRef, defaultProfile);
          setUserProfile(defaultProfile);
           setUser(prevUser => ({
            ...prevUser!,
            displayName: defaultProfile.nombre || prevUser!.displayName,
            photoURL: defaultProfile.fotoPerfil || prevUser!.photoURL,
          }));
        } catch (error) {
          console.error("Error creating default user profile:", error);
        }
      }
    }, (error) => {
      console.error("Error fetching user profile:", error);
      // Handle error, maybe set a default local profile or indicate an issue
    });

    return () => unsubscribe(); // Cleanup snapshot listener

  }, []);

  return { 
    user, 
    loading, 
    userId: user ? user.uid : null, 
    userProfile,
    setUserProfileState 
  };
}
