
// Tipos para Firestore

export interface UserProfile {
  uid: string;
  nombre: string;
  correo: string;
  fotoPerfil?: string;
  tema?: 'light' | 'dark' | 'system'; // Ampliado para incluir 'system'
  idioma?: 'es' | 'en';
  isAdmin?: boolean;
  configPreferencias?: Record<string, any>; // Objeto opcional para ajustes adicionales
}

export interface ForumPost {
  id: string; // El ID del documento en Firestore
  titulo: string;
  contenido: string;
  autorId: string; // UID del usuario que creó el post
  autorNombre?: string; // Denormalizado para fácil visualización
  autorFoto?: string; // Denormalizado
  fechaCreacion: any; // Debería ser Timestamp de Firestore, pero 'any' por simplicidad en cliente
  categoria: 'profesores' | 'estudiantes' | 'recursos' | 'general'; // 'general' como opción
  likes?: string[]; // Array de UIDs de usuarios que dieron like
  gracias?: string[]; // Array de UIDs de usuarios que dieron gracias
  likesCount?: number; // Denormalizado
  graciasCount?: number; // Denormalizado
  commentsCount?: number; // Denormalizado: número total de comentarios
  // No es necesario 'comments' aquí si los cargamos como subcolección
}

export interface ForumComment {
  id: string; // El ID del documento en Firestore
  contenido: string;
  autorId: string; // UID del usuario
  autorNombre?: string; // Denormalizado
  autorFoto?: string; // Denormalizado
  fecha: any; // Debería ser Timestamp de Firestore
  respuestaA?: string | null; // ID del comentario padre para anidamiento
  likes?: string[]; // Array de UIDs
  gracias?: string[]; // Array de UIDs
  likesCount?: number; // Denormalizado
  graciasCount?: number; // Denormalizado
  // 'replies' no es necesario si cargamos respuestas basadas en 'respuestaA'
}

export interface StudyMaterial {
  id: string; // ID del documento
  title: string;
  type: string; // Ej: "Documento", "Video", "Recurso Web"
  subject: string; // Ej: "Fundamentos de IA", "Genkit"
  uploaderId: string; // UID del que subió el material
  uploaderName?: string; // Denormalizado
  uploadDate: any; // Timestamp de Firestore
  size?: string; // Ej: "2.5 MB", "N/A"
  description?: string;
  downloadUrl?: string; // URL para descargar, si aplica
  iconName?: string; // Nombre de un icono de lucide-react para representar el tipo
}
