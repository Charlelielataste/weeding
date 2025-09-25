// Utilitaires pour générer des thumbnails de vidéos côté client

/**
 * Génère un thumbnail (image) à partir d'un fichier vidéo
 * @param videoFile - Le fichier vidéo
 * @param timeSeconds - Moment où capturer (en secondes, défaut: 1s)
 * @returns Promise avec l'URL blob du thumbnail
 */
export async function generateVideoThumbnail(
  videoFile: File,
  timeSeconds: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context non disponible"));
      return;
    }

    video.addEventListener("loadedmetadata", () => {
      // Définir la taille du canvas (aspect ratio préservé)
      const maxWidth = 320;
      const maxHeight = 180;

      let { videoWidth, videoHeight } = video;

      // Calculer les dimensions en gardant l'aspect ratio
      if (videoWidth > videoHeight) {
        if (videoWidth > maxWidth) {
          videoHeight = (videoHeight * maxWidth) / videoWidth;
          videoWidth = maxWidth;
        }
      } else {
        if (videoHeight > maxHeight) {
          videoWidth = (videoWidth * maxHeight) / videoHeight;
          videoHeight = maxHeight;
        }
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Aller au moment spécifié
      video.currentTime = Math.min(timeSeconds, video.duration - 0.1);
    });

    video.addEventListener("seeked", () => {
      // Dessiner la frame actuelle sur le canvas
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir en blob URL
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve(thumbnailUrl);
          } else {
            reject(new Error("Impossible de créer le thumbnail"));
          }
        },
        "image/jpeg",
        0.8
      ); // 80% qualité JPEG

      // Nettoyer
      video.remove();
    });

    video.addEventListener("error", (e) => {
      reject(new Error(`Erreur chargement vidéo: ${e}`));
    });

    // Charger la vidéo
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

/**
 * Génère plusieurs thumbnails à différents moments de la vidéo
 * @param videoFile - Le fichier vidéo
 * @param count - Nombre de thumbnails à générer (défaut: 3)
 * @returns Promise avec array d'URLs blob
 */
export async function generateMultipleThumbnails(
  videoFile: File,
  count: number = 3
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const thumbnails: string[] = [];

    video.addEventListener("loadedmetadata", async () => {
      const duration = video.duration;
      const interval = duration / (count + 1); // Éviter début et fin

      try {
        for (let i = 1; i <= count; i++) {
          const timePoint = interval * i;
          const thumbnail = await generateVideoThumbnail(videoFile, timePoint);
          thumbnails.push(thumbnail);
        }
        resolve(thumbnails);
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener("error", (e) => {
      reject(new Error(`Erreur chargement vidéo: ${e}`));
    });

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

/**
 * Nettoie les URLs blob générées pour libérer la mémoire
 * @param thumbnailUrls - Array d'URLs à nettoyer
 */
/**
 * Convertit un thumbnail blob en base64 pour l'upload
 * @param thumbnailUrl - URL blob du thumbnail
 * @returns Promise avec les données base64
 */
export async function thumbnailToBase64(thumbnailUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context non disponible"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      // Convertir en base64
      const base64Data = canvas.toDataURL("image/jpeg", 0.8);
      resolve(base64Data);
    };

    img.onerror = () => {
      reject(new Error("Erreur chargement image"));
    };

    img.src = thumbnailUrl;
  });
}

export function cleanupThumbnails(thumbnailUrls: string[]) {
  thumbnailUrls.forEach((url) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  });
}
