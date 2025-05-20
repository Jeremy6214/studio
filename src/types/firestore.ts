
// Simplificando tipos para gestión local, si es necesario.
// Opcionalmente, se pueden definir aquí tipos más simples para el estado local.

export interface ForumPost {
  id: string;
  titulo: string;
  contenido: string;
  autorNombre?: string; // Puede ser un campo de texto simple
  autorFoto?: string;   // URL de imagen simple
  fechaCreacion: Date; // Usar Date de JS
  categoria: 'profesores' | 'estudiantes' | 'recursos';
  likes: number; // Contador simple
  gracias: number; // Contador simple
  commentsCount: number;
  comments?: ForumComment[]; // Comentarios locales anidados
}

export interface ForumComment {
  id: string;
  contenido: string;
  autorNombre?: string; // Puede ser un campo de texto simple
  autorFoto?: string;   // URL de imagen simple
  fecha: Date; // Usar Date de JS
  respuestaA?: string | null;
  likes: number; // Contador simple
  gracias: number; // Contador simple
  replies?: ForumComment[];
}

// UserProfile ya no es relevante para la lógica principal sin autenticación.
// export interface UserProfile {
//   uid: string;
//   nombre: string;
//   correo: string;
//   fotoPerfil?: string;
//   tema?: 'light' | 'dark' | 'system';
//   idioma?: 'es' | 'en';
//   isAdmin?: boolean;
// }
