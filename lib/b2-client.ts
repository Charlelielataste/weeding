// Configuration et client Backblaze B2
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";

export function createB2Client() {
  const endpoint = process.env.B2_ENDPOINT;
  const region = process.env.B2_REGION || "eu-central-003";
  const accessKeyId = process.env.B2_APPLICATION_KEY_ID;
  const secretAccessKey = process.env.B2_APPLICATION_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Configuration B2 manquante. Vérifiez vos variables d'environnement."
    );
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true, // Requis pour B2
  });
}

export const B2_CONFIG = {
  bucketName: process.env.B2_BUCKET_NAME,
  publicUrl: process.env.B2_PUBLIC_URL, // URL publique de votre bucket
};

export function getPublicUrl(key: string): string {
  const publicUrl = B2_CONFIG.publicUrl;
  if (!publicUrl) {
    throw new Error("B2_PUBLIC_URL non configuré");
  }
  return `${publicUrl}/${key}`;
}

// Upload un fichier directement vers B2 (pour les chunks assemblés)
export async function uploadFile(
  filePath: string,
  key: string,
  contentType: string
): Promise<{
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  webViewLink: string;
  size: number;
  type: string;
}> {
  const client = createB2Client();

  if (!B2_CONFIG.bucketName) {
    throw new Error("B2_BUCKET_NAME non configuré");
  }

  console.log("📤 Upload direct vers B2:", { key, contentType });

  // Lire le fichier
  const fileBuffer = await fs.readFile(filePath);
  const fileStats = await fs.stat(filePath);

  // Upload via PutObjectCommand
  const command = new PutObjectCommand({
    Bucket: B2_CONFIG.bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await client.send(command);

  console.log("✅ Upload B2 direct réussi");

  // Retourner les infos du fichier dans le format attendu
  const publicUrl = getPublicUrl(key);

  return {
    id: key,
    name: key.split("/").pop() || key,
    url: publicUrl,
    thumbnailUrl: publicUrl,
    webViewLink: publicUrl,
    size: fileStats.size,
    type: contentType,
  };
}
