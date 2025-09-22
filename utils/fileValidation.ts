// Utilitaires pour la validation des fichiers
import { FileValidationResult } from "../types";

// Constantes de validation
export const MAX_PHOTOS = 50;
export const MAX_VIDEO_SIZE_TOTAL = 300 * 1024 * 1024; // 300MB total
// Plus de limite par fichier individuel !

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/mov",
  "video/avi",
  "video/webm",
  "video/3gp",
  "video/quicktime",
  "video/x-msvideo",
];

export const ALLOWED_VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "webm", "3gp"];

// Validation des photos
export function validatePhotos(
  newFiles: File[],
  currentPhotoCount: number
): FileValidationResult {
  const errors: string[] = [];
  const validFiles: File[] = [];

  // Filtrer pour ne garder que les images
  for (const file of newFiles) {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      errors.push(`"${file.name}" n'est pas une image !`);
      continue;
    }
    validFiles.push(file);
  }

  // Vérifier la limite totale
  const totalFiles = currentPhotoCount + validFiles.length;
  if (totalFiles > MAX_PHOTOS) {
    errors.push(
      `Limite dépassée ! Max ${MAX_PHOTOS} photos par envoi. Actuel: ${currentPhotoCount}, Nouveau: ${validFiles.length}`
    );
    return { validFiles: [], errors };
  }

  return { validFiles, errors };
}

// Validation des vidéos
export function validateVideos(
  newFiles: File[],
  currentVideoFiles: File[]
): FileValidationResult {
  const errors: string[] = [];
  const validFiles: File[] = [];

  for (const file of newFiles) {
    // Vérifier que c'est bien une vidéo
    const isVideo =
      file.type.startsWith("video/") ||
      ALLOWED_VIDEO_EXTENSIONS.some((ext) =>
        file.name.toLowerCase().endsWith("." + ext)
      );

    if (!isVideo) {
      errors.push(`"${file.name}" n'est pas une vidéo !`);
      continue;
    }

    // Plus de limite par fichier individuel - seule la limite totale compte !

    // Vérifier le type de fichier plus spécifiquement
    if (
      !ALLOWED_VIDEO_TYPES.some(
        (type) => file.type.includes(type.split("/")[1]) || file.type === type
      )
    ) {
      // Si le type MIME n'est pas reconnu, vérifier l'extension
      const extension = file.name.toLowerCase().split(".").pop();
      if (!ALLOWED_VIDEO_EXTENSIONS.includes(extension || "")) {
        errors.push(
          `Format de "${file.name}" non supporté ! Formats acceptés: MP4, MOV, AVI, WebM, 3GP. Type détecté: ${file.type}`
        );
        continue;
      }
    }

    validFiles.push(file);
  }

  // Vérifier la limite totale de 300MB pour toutes les vidéos
  if (validFiles.length > 0) {
    const currentTotalSize = currentVideoFiles.reduce(
      (sum, file) => sum + file.size,
      0
    );
    const newTotalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSize = currentTotalSize + newTotalSize;

    if (totalSize > MAX_VIDEO_SIZE_TOTAL) {
      const currentSizeMB = Math.round(currentTotalSize / (1024 * 1024));
      const newSizeMB = Math.round(newTotalSize / (1024 * 1024));
      const maxSizeMB = Math.round(MAX_VIDEO_SIZE_TOTAL / (1024 * 1024));

      errors.push(
        `Limite totale dépassée ! Max total: ${maxSizeMB}MB. Actuel: ${currentSizeMB}MB. Nouveau: ${newSizeMB}MB. Total serait: ${Math.round(
          totalSize / (1024 * 1024)
        )}MB`
      );
      return { validFiles: [], errors };
    }
  }

  return { validFiles, errors };
}

// Calculer la taille totale des vidéos
export function calculateVideoTotalSize(files: File[]): {
  totalSizeMB: number;
  maxSizeMB: number;
  percentage: number;
} {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalSizeMB = Math.round(totalSize / (1024 * 1024));
  const maxSizeMB = Math.round(MAX_VIDEO_SIZE_TOTAL / (1024 * 1024));
  const percentage = (totalSize / MAX_VIDEO_SIZE_TOTAL) * 100;

  return { totalSizeMB, maxSizeMB, percentage };
}
