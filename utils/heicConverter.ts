// Utilitaire pour convertir les fichiers HEIC en JPEG
import heic2any from "heic2any";

/**
 * Détecte si un fichier est au format HEIC
 */
export function isHEICFile(file: File): boolean {
  // Vérifier l'extension
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "heic" || extension === "heif") {
    return true;
  }

  // Vérifier le type MIME
  if (file.type === "image/heic" || file.type === "image/heif") {
    return true;
  }

  return false;
}

/**
 * Convertit un fichier HEIC en JPEG
 */
export async function convertHEICToJPEG(file: File): Promise<File> {
  try {
    console.log(`🔄 Conversion HEIC vers JPEG: ${file.name}`);

    // Convertir HEIC en JPEG avec heic2any
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9, // Qualité élevée (90%)
    });

    // heic2any peut retourner un tableau ou un seul blob
    const jpegBlob = Array.isArray(result) ? result[0] : result;

    // Créer un nouveau nom de fichier avec extension .jpg
    const originalName = file.name.replace(/\.(heic|heif)$/i, "");
    const newFileName = `${originalName}.jpg`;

    // Créer un nouveau fichier File à partir du blob
    const convertedFile = new File([jpegBlob], newFileName, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });

    console.log(`✅ Conversion réussie: ${file.name} → ${newFileName}`);
    return convertedFile;
  } catch (error) {
    console.error(`❌ Erreur conversion HEIC: ${file.name}`, error);
    throw new Error(
      `Impossible de convertir ${file.name}. Veuillez convertir manuellement cette photo en JPEG.`
    );
  }
}

/**
 * Traite une liste de fichiers et convertit les HEIC en JPEG
 */
export async function processFilesWithHEICConversion(
  files: File[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<File[]> {
  const processedFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    onProgress?.(i + 1, files.length, file.name);

    if (isHEICFile(file)) {
      try {
        const convertedFile = await convertHEICToJPEG(file);
        processedFiles.push(convertedFile);
      } catch (error) {
        // Re-throw l'erreur pour que l'appelant puisse la gérer
        throw error;
      }
    } else {
      // Fichier non-HEIC, on le garde tel quel
      processedFiles.push(file);
    }
  }

  return processedFiles;
}
