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
    maxFileSize: 1024 * 1024 * 1024, // 1GB pour les vidéos
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Erreur parsing formulaire:", err);

      let errorMessage = "Erreur parsing formulaire";
      if (err.code === "LIMIT_FILE_SIZE") {
        errorMessage = "Fichier trop volumineux (max 1GB)";
      } else if (err.code === "ECONNRESET") {
        errorMessage = "Connexion interrompue pendant l'upload";
      } else if (err.message?.includes("aborted")) {
        errorMessage = "Upload annulé";
      }

      return res.status(500).json({
        error: errorMessage,
        details: err.message,
        code: err.code || "UNKNOWN_ERROR",
      });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      console.error("❌ Aucun fichier reçu dans la requête");
      return res.status(400).json({
        error: "Aucun fichier reçu",
        debug: {
          filesKeys: Object.keys(files),
          fieldsKeys: Object.keys(fields),
        },
      });
    }

    try {
      console.log("📤 Upload vidéo vers B2:", {
        nom: file.originalFilename,
        taille: `${Math.round((file.size || 0) / (1024 * 1024))}MB`,
        type: file.mimetype,
        chemin: file.filepath,
        existe: fs.existsSync(file.filepath),
      });

      // Vérifier que le fichier existe vraiment
      if (!fs.existsSync(file.filepath)) {
        throw new Error(`Fichier temporaire introuvable: ${file.filepath}`);
      }

      // Créer un nom unique pour le fichier
      const timestamp = Date.now();
      const extension = path.extname(file.originalFilename || "");
      const fileName = `videos/${timestamp}_${
        file.originalFilename || `video${extension}`
      }`;

      // Lire le fichier
      const fileBuffer = fs.readFileSync(file.filepath);
      console.log(`📊 Fichier lu: ${fileBuffer.length} bytes`);

      if (fileBuffer.length === 0) {
        throw new Error("Le fichier est vide (0 bytes)");
      }

      // Créer le client B2
      const b2Client = createB2Client();

      // Déterminer le type MIME correct pour les vidéos Samsung
      let contentType = file.mimetype || "video/mp4";
      const ext = extension.toLowerCase();

      // Mappages spéciaux pour les formats Samsung
      if (ext === ".mp4" || ext === ".m4v") contentType = "video/mp4";
      else if (ext === ".mov" || ext === ".qt") contentType = "video/quicktime";
      else if (ext === ".3gp") contentType = "video/3gpp";
      else if (ext === ".webm") contentType = "video/webm";
      else if (ext === ".avi") contentType = "video/x-msvideo";

      console.log(`🎬 Type MIME déterminé: ${contentType}`);

      // Upload vers B2
      const uploadCommand = new PutObjectCommand({
        Bucket: B2_CONFIG.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
        // Métadonnées
        Metadata: {
          "original-name": file.originalFilename || "video.mp4",
          "upload-date": new Date().toISOString(),
          "original-mime": file.mimetype || "unknown",
          "file-size": String(file.size || 0),
        },
      });

      console.log("🚀 Début upload vers B2...");
      const uploadStart = Date.now();

      await b2Client.send(uploadCommand);

      const uploadTime = Date.now() - uploadStart;
      console.log(`✅ Upload B2 réussi en ${uploadTime}ms`);

      // Nettoie le fichier temporaire
      try {
        fs.unlinkSync(file.filepath);
        console.log("🧹 Fichier temporaire supprimé");
      } catch (cleanupError) {
        console.warn(
          "⚠️ Impossible de supprimer le fichier temporaire:",
          cleanupError
        );
      }

      // URL publique du fichier
      const publicUrl = getPublicUrl(fileName);

      console.log("🎉 Vidéo uploadée avec succès:", fileName);
      return res.status(200).json({
        success: true,
        uploadTime: uploadTime,
        file: {
          id: fileName,
          name: file.originalFilename,
          url: publicUrl,
          thumbnailUrl: publicUrl, // Utilise l'URL de la vidéo comme thumbnail
          webViewLink: publicUrl,
          size: file.size,
          type: contentType,
        },
      });
    } catch (error) {
      console.error("❌ Erreur upload vidéo B2:", error);

      // Nettoie le fichier temporaire en cas d'erreur
      try {
        if (file.filepath && fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
          console.log("🧹 Fichier temporaire nettoyé après erreur");
        }
      } catch (cleanupError) {
        console.warn(
          "⚠️ Impossible de supprimer le fichier temporaire:",
          cleanupError
        );
      }

      let errorMessage = "Erreur upload vers Backblaze B2";
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Messages d'erreur plus spécifiques
      if (errorMsg?.includes("credentials")) {
        errorMessage = "Erreur d'authentification B2. Vérifiez vos clés.";
      } else if (errorMsg?.includes("bucket")) {
        errorMessage = "Bucket B2 introuvable. Vérifiez la configuration.";
      } else if (errorMsg?.includes("NetworkingError")) {
        errorMessage = "Erreur réseau. Vérifiez votre connexion.";
      } else if (errorMsg?.includes("timeout")) {
        errorMessage = "Timeout - fichier trop volumineux ou connexion lente.";
      } else if (errorMsg?.includes("ENOENT")) {
        errorMessage = "Fichier temporaire perdu pendant l'upload.";
      }

      return res.status(500).json({
        error: errorMessage,
        details: errorMsg,
        debug: {
          fileName: file.originalFilename,
          fileSize: file.size,
          fileType: file.mimetype,
          timestamp: new Date().toISOString(),
          bucketName: B2_CONFIG.bucketName,
        },
      });
    }
  });
}
