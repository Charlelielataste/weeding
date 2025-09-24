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

    // Timeout pour les vidéos qui ne se chargent jamais
    const timeoutId = setTimeout(() => {
      video.remove();
      reject(
        new Error(
          "Timeout - impossible de charger la vidéo (probablement format iPhone non supporté)"
        )
      );
    }, 10000); // 10 secondes

    // Amélioration pour les vidéos iPhone
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true; // Important pour l'autoplay sur iOS
    video.playsInline = true; // Évite le mode plein écran sur iOS

    // Essayer de forcer le décodage
    video.setAttribute("webkit-playsinline", "true");

    video.addEventListener("loadedmetadata", () => {
      console.log("📹 Métadonnées vidéo chargées:", {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
      });

      // Vérifier que les dimensions sont valides
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        clearTimeout(timeoutId);
        video.remove();
        reject(new Error("Dimensions vidéo invalides - codec non supporté"));
        return;
      }

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

      // Aller au moment spécifié (mais pas trop tôt pour éviter les frames noires)
      const targetTime = Math.min(
        Math.max(timeSeconds, 0.5),
        video.duration - 0.5
      );
      video.currentTime = targetTime;
    });

    video.addEventListener("seeked", () => {
      try {
        // Vérifier que la vidéo est vraiment prête
        if (video.readyState < 2) {
          // HAVE_CURRENT_DATA
          console.warn(
            "⚠️ Vidéo pas complètement chargée, nouvelle tentative..."
          );
          setTimeout(() => {
            if (video.readyState >= 2) {
              renderThumbnail();
            } else {
              clearTimeout(timeoutId);
              video.remove();
              reject(new Error("Vidéo ne peut pas être décodée"));
            }
          }, 500);
          return;
        }

        renderThumbnail();
      } catch (error) {
        clearTimeout(timeoutId);
        video.remove();
        reject(error);
      }
    });

    function renderThumbnail() {
      try {
        // Dessiner la frame actuelle sur le canvas
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Vérifier que quelque chose a été dessiné (pas juste du noir)
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const isNotEmpty = imageData.data.some((pixel, index) => {
          // Vérifier qu'il y a des pixels non-noirs (en ignorant l'alpha)
          if (index % 4 === 3) return false; // Canal alpha
          return pixel > 10; // Seuil pour éviter le quasi-noir
        });

        if (!isNotEmpty) {
          console.warn(
            "⚠️ Frame apparemment vide, tentative à un autre moment..."
          );
          // Essayer à un autre moment
          video.currentTime = Math.min(
            video.duration * 0.25,
            video.duration - 1
          );
          return;
        }

        // Convertir en blob URL
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeoutId);
            if (blob) {
              const thumbnailUrl = URL.createObjectURL(blob);
              resolve(thumbnailUrl);
            } else {
              reject(new Error("Impossible de créer le thumbnail"));
            }
            // Nettoyer
            video.remove();
          },
          "image/jpeg",
          0.8
        ); // 80% qualité JPEG
      } catch (error) {
        clearTimeout(timeoutId);
        video.remove();
        reject(
          new Error(`Erreur lors de la génération du thumbnail: ${error}`)
        );
      }
    }

    video.addEventListener("error", (e) => {
      clearTimeout(timeoutId);
      const errorEvent = e as ErrorEvent;
      console.error("❌ Erreur chargement vidéo:", {
        error: errorEvent.error,
        message: errorEvent.message,
        mediaError: video.error,
      });

      let errorMessage = "Erreur chargement vidéo";
      if (video.error) {
        switch (video.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Chargement vidéo abandonné";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Erreur réseau lors du chargement";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage =
              "Erreur décodage vidéo - format probablement non supporté (iPhone HEVC?)";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Format vidéo non supporté par le navigateur";
            break;
        }
      }

      video.remove();
      reject(new Error(errorMessage));
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
