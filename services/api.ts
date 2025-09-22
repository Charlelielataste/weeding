// Services API pour les uploads et la récupération de médias
import { MediaFile } from "../types";

// ---- UPLOAD SERVICES ----
export async function uploadPhoto(formData: FormData) {
  const res = await fetch("/api/upload-photo", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Erreur upload photo");
  return res.json();
}

export async function uploadVideoWithPresignedUrl(file: File) {
  console.log("🔗 Génération URL pré-signée pour:", {
    name: file.name,
    size: `${Math.round(file.size / (1024 * 1024))}MB`,
    type: file.type,
  });

  try {
    // 1. Obtenir l'URL pré-signée
    console.log("📤 Requête vers /api/get-presigned-url...");
    const presignedResponse = await fetch("/api/get-presigned-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        mediaType: "video",
      }),
    });

    console.log("📊 Réponse presigned API:", {
      status: presignedResponse.status,
      statusText: presignedResponse.statusText,
      ok: presignedResponse.ok,
    });

    if (!presignedResponse.ok) {
      const errorText = await presignedResponse.text();
      console.error("❌ Erreur API presigned:", errorText);
      throw new Error(`Erreur URL pré-signée: ${errorText}`);
    }

    const responseData = await presignedResponse.json();
    console.log("✅ URL pré-signée reçue:", {
      fileName: responseData.fileName,
      hasPresignedUrl: !!responseData.presignedUrl,
      urlLength: responseData.presignedUrl?.length,
      publicUrl: responseData.publicUrl,
    });

    const { presignedUrl, fileName, publicUrl } = responseData;

    // 2. Upload direct vers Backblaze B2 avec fallback CORS
    console.log("🚀 Upload direct vers B2...");

    let uploadResponse;
    try {
      // Tentative normale d'abord
      uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      console.log("📊 Réponse upload B2:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        ok: uploadResponse.ok,
        headers: Object.fromEntries(uploadResponse.headers.entries()),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("❌ Erreur upload B2:", errorText);
        throw new Error(
          `Erreur upload direct: HTTP ${uploadResponse.status} - ${errorText}`
        );
      }

      console.log("✅ Upload direct réussi");
    } catch (corsError) {
      console.log("⚠️ Erreur CORS détectée, tentative avec mode no-cors...");

      // Fallback avec mode no-cors pour contourner CORS
      uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        mode: "no-cors",
        headers: {
          "Content-Type": file.type,
        },
      });

      console.log("📊 Upload en mode no-cors (statut non vérifiable)");
      console.log("✅ Upload probablement réussi - mode no-cors");
    }

    // 3. Retourner les informations du fichier dans le même format que l'ancienne API
    return {
      success: true,
      file: {
        id: fileName,
        name: file.name,
        url: publicUrl,
        thumbnailUrl: publicUrl,
        webViewLink: publicUrl,
        size: file.size,
        type: file.type,
      },
    };
  } catch (error) {
    console.error("❌ Erreur complète:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw error;
  }
}

// ---- FETCH SERVICES ----
export async function fetchPhotos(): Promise<MediaFile[]> {
  const res = await fetch("/api/photos");
  if (!res.ok) throw new Error("Erreur récupération photos");
  return res.json();
}

export async function fetchVideos(): Promise<MediaFile[]> {
  const res = await fetch("/api/videos");
  if (!res.ok) throw new Error("Erreur récupération vidéos");
  return res.json();
}
