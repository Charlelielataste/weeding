import type { NextApiRequest, NextApiResponse } from "next";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createB2Client, B2_CONFIG, getPublicUrl } from "../../lib/b2-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("🔍 Début récupération photos B2...");

    // Paramètres de pagination
    const limit = parseInt(req.query.limit as string) || 20; // 20 photos par page par défaut
    const cursor = req.query.cursor as string; // Token de pagination

    console.log("📄 Pagination:", { limit, cursor });

    const b2Client = createB2Client();

    const listCommand = new ListObjectsV2Command({
      Bucket: B2_CONFIG.bucketName,
      Prefix: "photos/",
      MaxKeys: limit,
      ContinuationToken: cursor || undefined, // Token pour la page suivante
    });

    const response = await b2Client.send(listCommand);

    // Transformer les objets B2 en format compatible avec l'interface
    const photos = (response.Contents || [])
      .filter((object) => object.Key && object.Key !== "photos/") // Exclure le dossier lui-même
      .map((object) => {
        const publicUrl = getPublicUrl(object.Key!);
        return {
          id: object.Key!,
          name: object.Key!.split("/").pop() || object.Key!, // Nom du fichier sans le chemin
          thumbnailLink: publicUrl,
          webViewLink: publicUrl,
          createdTime:
            object.LastModified?.toISOString() || new Date().toISOString(),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
      ); // Plus récent en premier

    console.log(`📸 ${photos.length} photos trouvées (page)`);

    // Réponse avec métadonnées de pagination
    res.json({
      data: photos,
      pagination: {
        hasMore: !!response.IsTruncated,
        nextCursor: response.NextContinuationToken || null,
        limit,
        count: photos.length,
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération photos B2:", error);

    let errorMessage = "Erreur récupération photos";
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
