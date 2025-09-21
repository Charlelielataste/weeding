import type { NextApiRequest, NextApiResponse } from "next";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createB2Client, B2_CONFIG, getPublicUrl } from "../../lib/b2-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("🔍 Début récupération vidéos B2...");
    const b2Client = createB2Client();

    const listCommand = new ListObjectsV2Command({
      Bucket: B2_CONFIG.bucketName,
      Prefix: "videos/", // Seulement les fichiers dans le dossier videos/
      MaxKeys: 100,
    });

    const response = await b2Client.send(listCommand);

    // Transformer les objets B2 en format compatible avec l'interface
    const videos = (response.Contents || [])
      .filter((object) => object.Key && object.Key !== "videos/") // Exclure le dossier lui-même
      .map((object) => {
        const publicUrl = getPublicUrl(object.Key!);
        return {
          id: object.Key!,
          name: object.Key!.split("/").pop() || object.Key!, // Nom du fichier sans le chemin
          thumbnailLink: null, // Pas de thumbnail pour les vidéos B2
          webViewLink: publicUrl,
          createdTime:
            object.LastModified?.toISOString() || new Date().toISOString(),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
      ); // Plus récent en premier

    console.log(`🎬 ${videos.length} vidéos trouvées`);
    res.json(videos);
  } catch (error) {
    console.error("❌ Erreur récupération vidéos B2:", error);

    let errorMessage = "Erreur récupération vidéos";
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg?.includes("credentials")) {
      errorMessage = "Erreur d'authentification B2. Vérifiez vos clés.";
    } else if (errorMsg?.includes("bucket")) {
      errorMessage = "Bucket B2 introuvable. Vérifiez la configuration.";
    }

    res.status(500).json({
      error: errorMessage,
      details: errorMsg,
    });
  }
}
