import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createB2Client, B2_CONFIG, getPublicUrl } from "../../lib/b2-client";
import path from "path";

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const form = formidable({
    maxFileSize: 4 * 1024 * 1024, // 4MB max pour upload simple (> 4MB sera géré par chunks)
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erreur parsing formulaire photo:", err);

      let errorMessage = "Erreur parsing formulaire photo";
      if (err.code === "LIMIT_FILE_SIZE") {
        errorMessage =
          "Photo trop volumineuse pour upload simple (max 4MB). Le chunking automatique devrait être utilisé.";
      } else if (err.code === "ECONNRESET") {
        errorMessage = "Connexion interrompue pendant l'upload photo";
      } else if (err.message?.includes("aborted")) {
        errorMessage = "Upload photo annulé";
      }

      return res.status(500).json({
        error: errorMessage,
        details: err.message,
        code: err.code || "UNKNOWN_ERROR",
        hint: "Les photos > 4MB utilisent automatiquement le chunking",
      });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }

    try {
      console.log("📤 Upload photo vers B2:", file.originalFilename);

      // Créer un nom unique pour le fichier
      const timestamp = Date.now();
      const extension = path.extname(file.originalFilename || "");
      const fileName = `photos/${timestamp}_${
        file.originalFilename || `photo${extension}`
      }`;

      // Lire le fichier
      const fileBuffer = fs.readFileSync(file.filepath);

      // Créer le client B2
      const b2Client = createB2Client();

      // Upload vers B2
      const uploadCommand = new PutObjectCommand({
        Bucket: B2_CONFIG.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.mimetype || "image/jpeg",
        // Métadonnées
        Metadata: {
          "original-name": file.originalFilename || "photo.jpg",
          "upload-date": new Date().toISOString(),
          "upload-method": "simple",
          "file-size": file.size?.toString() || "unknown",
        },
      });

      await b2Client.send(uploadCommand);

      // Nettoie le fichier temporaire
      try {
        fs.unlinkSync(file.filepath);
      } catch (cleanupError) {
        console.warn(
          "Impossible de supprimer le fichier temporaire:",
          cleanupError
        );
      }

      // URL publique du fichier
      const publicUrl = getPublicUrl(fileName);

      console.log("✅ Photo uploadée avec succès:", fileName);
      return res.status(200).json({
        success: true,
        file: {
          id: fileName,
          name: file.originalFilename,
          url: publicUrl,
          thumbnailUrl: publicUrl, // B2 peut générer des thumbnails avec transform
          webViewLink: publicUrl,
        },
      });
    } catch (error) {
      console.error("❌ Erreur upload photo B2:", error);

      // Nettoie le fichier temporaire en cas d'erreur
      try {
        if (file.filepath) fs.unlinkSync(file.filepath);
      } catch (cleanupError) {
        console.warn(
          "Impossible de supprimer le fichier temporaire:",
          cleanupError
        );
      }

      let errorMessage = "Erreur upload vers Backblaze B2";
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg?.includes("credentials")) {
        errorMessage = "Erreur d'authentification B2. Vérifiez vos clés.";
      } else if (errorMsg?.includes("bucket")) {
        errorMessage = "Bucket B2 introuvable. Vérifiez la configuration.";
      }

      return res.status(500).json({
        error: errorMessage,
        details: errorMsg,
      });
    }
  });
}
