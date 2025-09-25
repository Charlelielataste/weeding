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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const form = formidable({
      uploadDir: "/tmp", // Dossier temporaire
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB max par chunk
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

      // Upload vers B2
      const timestamp = Date.now();
      const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueFileName = `videos/${timestamp}_${sanitizedName}`;

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
    return res.status(500).json({
      error: "Erreur lors de l'upload du chunk",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
