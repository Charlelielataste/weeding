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
    maxFileSize: 500 * 1024 * 1024, // 500MB pour les vidéos
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erreur parsing formulaire:", err);
      return res.status(500).json({ error: "Erreur parsing formulaire" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }

    try {
      console.log("📤 Upload vidéo vers B2:", file.originalFilename);

      // Créer un nom unique pour le fichier
      const timestamp = Date.now();
      const extension = path.extname(file.originalFilename || "");
      const fileName = `videos/${timestamp}_${
        file.originalFilename || `video${extension}`
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
        ContentType: file.mimetype || "video/mp4",
        // Métadonnées
        Metadata: {
          "original-name": file.originalFilename || "video.mp4",
          "upload-date": new Date().toISOString(),
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

      console.log("✅ Vidéo uploadée avec succès:", fileName);
      return res.status(200).json({
        success: true,
        file: {
          id: fileName,
          name: file.originalFilename,
          url: publicUrl,
          thumbnailUrl: publicUrl, // Peut être amélioré avec des thumbnails vidéo
          webViewLink: publicUrl,
        },
      });
    } catch (error) {
      console.error("❌ Erreur upload vidéo B2:", error);

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
