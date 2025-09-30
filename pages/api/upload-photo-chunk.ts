import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createB2Client, B2_CONFIG, getPublicUrl } from "../../lib/b2-client";

// Config pour traiter les fichiers photos
export const config = {
  api: {
    bodyParser: false, // Désactive le parser par défaut
  },
};

// Store des chunks photos en cours d'upload
const photoUploadSessions: Record<
  string,
  {
    fileName: string;
    totalChunks: number;
    receivedChunks: number[];
    tempDir: string;
    fileType: string;
  }
> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("📸 API upload-photo-chunk appelée:", {
    method: req.method,
    headers: {
      "content-type": req.headers["content-type"],
      "content-length": req.headers["content-length"],
    },
    timestamp: new Date().toISOString(),
  });

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

    console.log("📋 Chunk photo reçu:", {
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
    if (!photoUploadSessions[uploadId]) {
      photoUploadSessions[uploadId] = {
        fileName: originalFileName,
        totalChunks,
        receivedChunks: [],
        tempDir: `/tmp/photo_upload_${uploadId}`,
        fileType: fileType || "image/jpeg",
      };

      // Créer le dossier temporaire
      await fs.mkdir(photoUploadSessions[uploadId].tempDir, {
        recursive: true,
      });
    }

    const session = photoUploadSessions[uploadId];
    const chunkFile = Array.isArray(files.chunk) ? files.chunk[0] : files.chunk;

    // Sauvegarder le chunk
    const chunkPath = path.join(session.tempDir, `chunk_${chunkIndex}`);
    await fs.copyFile(chunkFile.filepath, chunkPath);

    // Marquer le chunk comme reçu
    session.receivedChunks.push(chunkIndex);

    console.log(`✅ Chunk photo ${chunkIndex + 1}/${totalChunks} sauvegardé`);

    // Vérifier si tous les chunks sont reçus
    if (session.receivedChunks.length === totalChunks) {
      console.log("🔄 Tous les chunks photo reçus, assemblage...");

      // Assembler le fichier final
      const finalFilePath = `/tmp/final_photo_${uploadId}_${originalFileName}`;
      const writeStream = await fs.open(finalFilePath, "w");

      // Assembler les chunks dans l'ordre
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(session.tempDir, `chunk_${i}`);
        const chunkData = await fs.readFile(chunkPath);
        await writeStream.write(chunkData);
      }

      await writeStream.close();

      console.log("📤 Upload photo vers B2...");

      // Créer un nom unique pour le fichier
      const timestamp = Date.now();
      const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueFileName = `photos/${timestamp}_${sanitizedName}`;

      // Créer le client B2
      const b2Client = createB2Client();

      // Lire le fichier assemblé
      const fileBuffer = await fs.readFile(finalFilePath);

      // Upload vers B2
      const uploadCommand = new PutObjectCommand({
        Bucket: B2_CONFIG.bucketName,
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: session.fileType,
        // Métadonnées
        Metadata: {
          "original-name": originalFileName,
          "upload-date": new Date().toISOString(),
          "upload-method": "chunks",
          "total-chunks": totalChunks.toString(),
        },
      });

      await b2Client.send(uploadCommand);

      // Nettoyer les fichiers temporaires
      await fs.rm(session.tempDir, { recursive: true, force: true });
      await fs.unlink(finalFilePath);
      delete photoUploadSessions[uploadId];

      // URL publique du fichier
      const publicUrl = getPublicUrl(uniqueFileName);

      console.log("✅ Photo uploadée avec succès via chunks:", uniqueFileName);

      return res.status(200).json({
        success: true,
        file: {
          id: uniqueFileName,
          name: originalFileName,
          url: publicUrl,
          thumbnailUrl: publicUrl,
          webViewLink: publicUrl,
        },
        message: "Upload photo terminé avec succès",
        uploadMethod: "chunks",
        totalChunks,
      });
    } else {
      // Chunk reçu, en attente des autres
      return res.status(200).json({
        success: true,
        message: `Chunk photo ${chunkIndex + 1}/${totalChunks} reçu`,
        receivedChunks: session.receivedChunks.length,
        totalChunks,
      });
    }
  } catch (error) {
    console.error("❌ Erreur upload chunk photo:", error);

    // Messages d'erreur plus spécifiques
    let errorMessage = "Erreur lors de l'upload du chunk photo";
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg?.includes("maxFileSize")) {
      errorMessage =
        "Chunk photo trop volumineux (max 4MB). Limite Vercel dépassée.";
    } else if (errorMsg?.includes("LIMIT_FILE_SIZE")) {
      errorMessage =
        "Taille du chunk photo dépassée. Essayez avec des fichiers plus petits.";
    } else if (errorMsg?.includes("ENOENT")) {
      errorMessage = "Fichier temporaire perdu pendant le traitement photo.";
    } else if (errorMsg?.includes("ENOSPC")) {
      errorMessage = "Espace disque insuffisant sur le serveur.";
    } else if (errorMsg?.includes("timeout")) {
      errorMessage = "Timeout durant l'upload du chunk photo.";
    } else if (errorMsg?.includes("credentials")) {
      errorMessage = "Erreur d'authentification B2 pour la photo.";
    } else if (errorMsg?.includes("bucket")) {
      errorMessage = "Bucket B2 introuvable pour la photo.";
    }

    return res.status(500).json({
      error: errorMessage,
      details: errorMsg,
      debug: {
        timestamp: new Date().toISOString(),
        chunkSize: "Max 4MB",
        vercelLimit: "4.5MB total body size",
        fileType: "photo",
      },
    });
  }
}
