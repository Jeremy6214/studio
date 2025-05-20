
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  nombre: string;
  correo: string;
  fotoPerfil?: string;
  tema?: 'light' | 'dark' | 'system';
  idioma?: 'es' | 'en';
  // configPreferencias?: Record<string, any>; // Opcional
}

export interface ForumPost {
  id: string;
  titulo: string;
  contenido: string;
  autorId: string;
  autorNombre?: string; // Para mostrar rápidamente sin otra consulta
  autorFoto?: string; // Para mostrar rápidamente sin otra consulta
  fechaCreacion: Timestamp;
  categoria: "profesores" | "estudiantes" | "recursos";
  likes: string[]; // Array de UIDs
  gracias: string[]; // Array de UIDs
  commentsCount?: number; // Denormalized count
}

export interface ForumComment {
  id: string;
  contenido: string;
  autorId: string;
  autorNombre?: string;
  autorFoto?: string;
  fecha: Timestamp;
  respuestaA?: string | null; // ID del comentario padre
  likes: string[]; // Array de UIDs
  gracias: string[]; // Array de UIDs
  replies?: ForumComment[]; // Para anidamiento en UI, se carga por separado o se construye
}
