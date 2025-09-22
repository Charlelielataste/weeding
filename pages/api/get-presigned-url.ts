import type { NextApiRequest, NextApiResponse } from "next";
import { generatePresignedUploadUrl, getPublicUrl } from "../../lib/b2-client";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("🔗 API presigned URL appelée:", {
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString(),
  });

  if (req.method !== "POST") {
    console.log("❌ Méthode non autorisée:", req.method);
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { fileName, fileType, mediaType } = req.body;
    console.log("📋 Paramètres reçus:", { fileName, fileType, mediaType });

    if (!fileName || !fileType || !mediaType) {
      console.log("❌ Paramètres manquants");
      return res.status(400).json({
        error: "Paramètres manquants (fileName, fileType, mediaType requis)",
      });
    }

    // Créer un nom unique pour le fichier
    const timestamp = Date.now();
    const extension = path.extname(fileName);
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${mediaType}s/${timestamp}_${sanitizedName}`;

    // Déterminer le bon Content-Type
    let contentType = fileType;

    // Pour les vidéos, s'assurer que le type MIME est correct
    if (mediaType === "video") {
      const ext = extension.toLowerCase();
      if (ext === ".mp4" || ext === ".m4v") contentType = "video/mp4";
      else if (ext === ".mov" || ext === ".qt") contentType = "video/quicktime";
      else if (ext === ".3gp") contentType = "video/3gpp";
      else if (ext === ".webm") contentType = "video/webm";
      else if (ext === ".avi") contentType = "video/x-msvideo";
    }

    console.log("🔗 Génération URL pré-signée:", {
      fileName: uniqueFileName,
      contentType,
      mediaType,
      originalName: fileName,
    });

    // Générer l'URL pré-signée (expire dans 1 heure)
    console.log("🔄 Génération de l'URL pré-signée...");
    const presignedUrl = await generatePresignedUploadUrl(
      uniqueFileName,
      contentType,
      3600 // 1 heure
    );

    console.log("✅ URL pré-signée générée:", {
      urlLength: presignedUrl.length,
      startsWithHttps: presignedUrl.startsWith("https://"),
      domain: new URL(presignedUrl).hostname,
    });

    // URL publique pour accéder au fichier après upload
    const publicUrl = getPublicUrl(uniqueFileName);
    console.log("📍 URL publique générée:", publicUrl);

    console.log("✅ Réponse envoyée avec succès");
    return res.status(200).json({
      success: true,
      presignedUrl,
      fileName: uniqueFileName,
      publicUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("❌ Erreur génération URL pré-signée:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    return res.status(500).json({
      error: "Erreur lors de la génération de l'URL pré-signée",
      details: errorMessage,
    });
  }
}
