
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  nombre: string;
  correo: string;
  fotoPerfil?: string;
  tema?: 'light' | 'dark' | 'system';
  idioma?: 'es' | 'en';
  // configPreferencias?: Record<string, any>; // Example for additional settings
}

export interface ForumPost {
  id: string;
  titulo: string;
  contenido: string;
  autorId: string;
  autorNombre?: string; // Denormalized for easier display
  autorFoto?: string;   // Denormalized
  fechaCreacion: Timestamp;
  categoria: 'profesores' | 'estudiantes' | 'recursos'; // Ensure these match categories in your UI
  likes: string[]; // Array of user UIDs who liked the post
  gracias: string[]; // Array of user UIDs who thanked the post
  commentsCount: number;
}

export interface ForumComment {
  id: string;
  contenido: string;
  autorId: string;
  autorNombre?: string; // Denormalized
  autorFoto?: string;   // Denormalized
  fecha: Timestamp;
  respuestaA?: string | null; // ID of the parent comment, if it's a reply
  likes: string[]; // Array of user UIDs
  gracias: string[]; // Array of user UIDs
  replies?: ForumComment[]; // Client-side property for building comment tree
}
