
"use client";

import { useState, useEffect } from 'react';
// Ya no importamos de Firebase
// import { onAuthStateChanged, User } from 'firebase/auth';
// import { auth } from '@/lib/firebase';

// Simulamos una interfaz de usuario por si algún componente aún la espera
// pero estará vacía o con valores por defecto.
export interface User {
  uid: string | null;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  userId: string | null;
}

export function useFirebaseAuth(): AuthState {
  // Siempre devolvemos un estado de "no usuario" y "carga finalizada"
  // para reflejar que no hay sistema de autenticación activo.
  return { user: null, loading: false, userId: null };
}
