// Configuration et client Backblaze B2
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

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

// Génère une URL pré-signée pour upload direct
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn: number = 3600 // 1 heure par défaut
): Promise<string> {
  const client = createB2Client();

  const command = new PutObjectCommand({
    Bucket: B2_CONFIG.bucketName,
    Key: fileName,
    ContentType: contentType,
  });

  return await getSignedUrl(client, command, { expiresIn });
}
