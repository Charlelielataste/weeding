import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";
import { uploadFile } from "../../lib/b2-client";

// Config pour traiter les fichiers
export const config = {
  api: {
    bodyParser: false, // Désactive le parser par défaut
  },
};

// Store des chunks en cours d'upload
const uploadSessions: Record<
  string,
  {
    fileName: string;
    totalChunks: number;
    receivedChunks: number[];
    tempDir: string;
  }
> = {};

// LIMITE de sessions simultanées pour éviter la surcharge disque
const MAX_CONCURRENT_SESSIONS = 5;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("📦 API upload-chunk appelée:", {
    method: req.method,
    headers: {
      "content-type": req.headers["content-type"],
      "content-length": req.headers["content-length"],
    },
    timestamp: new Date().toISOString(),
  });

  // NETTOYAGE PRÉVENTIF de l'espace disque pour éviter ENOSPC
  try {
    const tmpDir = "/tmp";
    const files = await fs.readdir(tmpDir);
    const oldFiles = files.filter(
      (file) =>
        file.startsWith("upload_") ||
        file.startsWith("final_") ||
        file.startsWith("tmp")
    );

    // Nettoyer les anciens fichiers temporaires (plus de 5 minutes)
    for (const file of oldFiles) {
      try {
        const filePath = path.join(tmpDir, file);
        const stats = await fs.stat(filePath);
        const age = Date.now() - stats.mtime.getTime();
        if (age > 5 * 60 * 1000) {
          // 5 minutes
          await fs.rm(filePath, { recursive: true, force: true });
          console.log("🧹 Fichier temporaire ancien nettoyé:", file);
        }
      } catch {
        // Ignorer les erreurs de nettoyage
      }
    }
  } catch (cleanupError) {
    console.warn("⚠️ Impossible de nettoyer l'espace disque:", cleanupError);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const form = formidable({
      uploadDir: "/tmp", // Dossier temporaire
      keepExtensions: true,
      maxFileSize: 4 * 1024 * 1024, // 4MB max par chunk (limite Vercel 4.5MB - marge sécurité)
    });

    const [fields, files] = await form.parse(req);

    const uploadId = Array.isArray(fields.uploadId)
      ? fields.uploadId[0]
      : fields.uploadId;
    const chunkIndex = parseInt(
      Array.isArray(fields.chunkIndex)
        ? fields.chunkIndex[0]
        : fields.chunkIndex || "0"
    );
    const totalChunks = parseInt(
      Array.isArray(fields.totalChunks)
        ? fields.totalChunks[0]
        : fields.totalChunks || "1"
    );
    const originalFileName = Array.isArray(fields.fileName)
      ? fields.fileName[0]
      : fields.fileName;
    const fileType = Array.isArray(fields.fileType)
      ? fields.fileType[0]
      : fields.fileType;

    console.log("📋 Chunk reçu:", {
      uploadId,
      chunkIndex,
      totalChunks,
      originalFileName,
      fileType,
    });

    if (!uploadId || !originalFileName || !files.chunk) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    // Initialiser la session d'upload si c'est le premier chunk
    if (!uploadSessions[uploadId]) {
      // VÉRIFIER LA LIMITE de sessions simultanées
      if (Object.keys(uploadSessions).length >= MAX_CONCURRENT_SESSIONS) {
        return res.status(429).json({
          error: "Trop d'uploads simultanés. Veuillez patienter.",
          details: `Maximum ${MAX_CONCURRENT_SESSIONS} uploads simultanés autorisés`,
          retryAfter: 30, // secondes
        });
      }

      uploadSessions[uploadId] = {
        fileName: originalFileName,
        totalChunks,
        receivedChunks: [],
        tempDir: `/tmp/upload_${uploadId}`,
      };

      // Créer le dossier temporaire
      await fs.mkdir(uploadSessions[uploadId].tempDir, { recursive: true });
    }

    const session = uploadSessions[uploadId];
    const chunkFile = Array.isArray(files.chunk) ? files.chunk[0] : files.chunk;

    // Sauvegarder le chunk
    const chunkPath = path.join(session.tempDir, `chunk_${chunkIndex}`);
    await fs.copyFile(chunkFile.filepath, chunkPath);

    // NETTOYER IMMÉDIATEMENT le fichier temporaire formidable pour libérer l'espace
    try {
      await fs.unlink(chunkFile.filepath);
    } catch (cleanupError) {
      console.warn(
        "⚠️ Impossible de nettoyer le fichier formidable:",
        cleanupError
      );
    }

    // Marquer le chunk comme reçu
    session.receivedChunks.push(chunkIndex);

    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} sauvegardé`);

    // Vérifier si tous les chunks sont reçus
    if (session.receivedChunks.length === totalChunks) {
      console.log("🔄 Tous les chunks reçus, assemblage...");

      // Assembler le fichier final
      const finalFilePath = `/tmp/final_${uploadId}_${originalFileName}`;
      const writeStream = await fs.open(finalFilePath, "w");

      // Assembler les chunks dans l'ordre
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(session.tempDir, `chunk_${i}`);
        const chunkData = await fs.readFile(chunkPath);
        await writeStream.write(chunkData);
      }

      await writeStream.close();

      console.log("📤 Upload vers B2...");

      // Upload vers B2 en utilisant l'uploadId pour éviter les collisions
      const timestampFromUploadId =
        uploadId.split("_")[1] || Date.now().toString();
      const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueFileName = `videos/${timestampFromUploadId}_${
        uploadId.split("_")[3] || "chunk"
      }_${sanitizedName}`;

      const uploadResult = await uploadFile(
        finalFilePath,
        uniqueFileName,
        fileType || "video/mp4"
      );

      // Nettoyer les fichiers temporaires
      await fs.rm(session.tempDir, { recursive: true, force: true });
      await fs.unlink(finalFilePath);
      delete uploadSessions[uploadId];

      console.log("✅ Upload final réussi");

      return res.status(200).json({
        success: true,
        file: {
          ...uploadResult,
          thumbnailUrl: uploadResult.url,
          thumbnailLink: uploadResult.url, // Utilise l'URL de la vidéo comme thumbnail
        },
        message: "Upload terminé avec succès",
      });
    } else {
      // Chunk reçu, en attente des autres
      return res.status(200).json({
        success: true,
        message: `Chunk ${chunkIndex + 1}/${totalChunks} reçu`,
        receivedChunks: session.receivedChunks.length,
        totalChunks,
      });
    }
  } catch (error) {
    console.error("❌ Erreur upload chunk:", error);

    // NETTOYER LES SESSIONS EN CAS D'ERREUR pour éviter les memory leaks
    const uploadId = req.body?.uploadId;
    if (uploadId && uploadSessions[uploadId]) {
      try {
        await fs.rm(uploadSessions[uploadId].tempDir, {
          recursive: true,
          force: true,
        });
        delete uploadSessions[uploadId];
        console.log("🧹 Session nettoyée après erreur:", uploadId);
      } catch (cleanupError) {
        console.warn("⚠️ Impossible de nettoyer la session:", cleanupError);
      }
    }

    // Messages d'erreur plus spécifiques
    let errorMessage = "Erreur lors de l'upload du chunk";
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg?.includes("maxFileSize")) {
      errorMessage = "Chunk trop volumineux (max 4MB). Limite Vercel dépassée.";
    } else if (errorMsg?.includes("LIMIT_FILE_SIZE")) {
      errorMessage =
        "Taille du chunk dépassée. Essayez avec des fichiers plus petits.";
    } else if (errorMsg?.includes("ENOENT")) {
      errorMessage = "Fichier temporaire perdu pendant le traitement.";
    } else if (errorMsg?.includes("ENOSPC")) {
      errorMessage = "Espace disque insuffisant sur le serveur.";
    } else if (errorMsg?.includes("timeout")) {
      errorMessage = "Timeout durant l'upload du chunk.";
    }

    return res.status(500).json({
      error: errorMessage,
      details: errorMsg,
      debug: {
        timestamp: new Date().toISOString(),
        chunkSize: "Max 4MB",
        vercelLimit: "4.5MB total body size",
      },
    });
  }
}
