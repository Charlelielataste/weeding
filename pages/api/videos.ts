import type { NextApiRequest, NextApiResponse } from "next";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createB2Client, B2_CONFIG, getPublicUrl } from "../../lib/b2-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("🔍 Début récupération vidéos B2...");

    // Paramètres de pagination
    const limit = parseInt(req.query.limit as string) || 10; // 10 vidéos par page par défaut
    const cursor = req.query.cursor as string; // Token de pagination

    console.log("📄 Pagination:", { limit, cursor });

    const b2Client = createB2Client();

    // Récupérer les vidéos avec pagination
    const listVideosCommand = new ListObjectsV2Command({
      Bucket: B2_CONFIG.bucketName,
      Prefix: "videos/",
      MaxKeys: limit,
      ContinuationToken: cursor || undefined,
    });

    // Récupérer TOUS les thumbnails (pas de pagination pour les thumbnails)
    const listThumbnailsCommand = new ListObjectsV2Command({
      Bucket: B2_CONFIG.bucketName,
      Prefix: "thumbnails/",
      MaxKeys: 1000, // Limit plus élevé pour récupérer tous les thumbnails
    });

    const [videosResponse, thumbnailsResponse] = await Promise.all([
      b2Client.send(listVideosCommand),
      b2Client.send(listThumbnailsCommand),
    ]);

    // Créer un map des thumbnails par nom de fichier
    const thumbnailMap = new Map<string, string>();
    (thumbnailsResponse.Contents || []).forEach((thumb) => {
      if (thumb.Key) {
        // Extraire le nom du fichier original depuis le thumbnail
        // thumbnails/1234567890_video.jpg -> video
        const thumbName = thumb.Key.split("/")
          .pop()
          ?.split("_")
          .slice(1)
          .join("_")
          .replace(".jpg", "");
        if (thumbName) {
          thumbnailMap.set(thumbName, getPublicUrl(thumb.Key));
        }
      }
    });

    console.log(`🖼️ ${thumbnailMap.size} thumbnails trouvés`);

    // Transformer les objets B2 en format compatible avec l'interface
    const videos = (videosResponse.Contents || [])
      .filter((object) => object.Key && object.Key !== "videos/")
      .map((object) => {
        const publicUrl = getPublicUrl(object.Key!);
        const fileName = object.Key!.split("/").pop() || object.Key!;

        // Chercher le thumbnail correspondant
        const videoBaseName = fileName
          .split("_")
          .slice(1)
          .join("_")
          .split(".")[0];
        const thumbnailUrl = thumbnailMap.get(videoBaseName) || publicUrl; // Fallback sur la vidéo elle-même

        return {
          id: object.Key!,
          name: fileName,
          thumbnailLink: thumbnailUrl,
          webViewLink: publicUrl,
          url: publicUrl,
          size: object.Size || 0,
          type: "video",
          createdTime:
            object.LastModified?.toISOString() || new Date().toISOString(),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
      );

    console.log(`🎬 ${videos.length} vidéos trouvées avec thumbnails (page)`);

    // Réponse avec métadonnées de pagination
    res.json({
      data: videos,
      pagination: {
        hasMore: !!videosResponse.IsTruncated,
        nextCursor: videosResponse.NextContinuationToken || null,
        limit,
        count: videos.length,
      },
    });
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
