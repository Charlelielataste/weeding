// Services API pour les uploads et la récupération de médias
import { MediaFile, PaginatedResponse } from "../types";

// ---- UPLOAD SERVICES ----
export async function uploadPhoto(formData: FormData) {
  const res = await fetch("/api/upload-photo", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Erreur upload photo");
  return res.json();
}

export async function uploadVideoWithPresignedUrl(
  file: File,
  onChunkProgress?: (chunkIndex: number, totalChunks: number) => void
) {
  console.log("🎬 Upload vidéo intelligent:", {
    name: file.name,
    size: `${Math.round(file.size / (1024 * 1024))}MB`,
    type: file.type,
  });

  const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB par chunk
  const MAX_SIMPLE_UPLOAD = 4 * 1024 * 1024; // 4MB limite upload simple

  // Si fichier <= 4MB → Upload simple via API
  if (file.size <= MAX_SIMPLE_UPLOAD) {
    console.log("📦 Fichier petit → Upload simple via API");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload-video", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload simple échoué: ${errorText}`);
    }

    console.log("✅ Upload simple réussi");
    return await response.json();
  }

  // Si fichier > 4MB → Upload par chunks
  console.log("📦 Fichier volumineux → Upload par chunks");

  return await uploadVideoInChunks(file, CHUNK_SIZE, onChunkProgress);
}

// Fonction pour upload par chunks
async function uploadVideoInChunks(
  file: File,
  chunkSize: number,
  onChunkProgress?: (chunkIndex: number, totalChunks: number) => void
) {
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = `upload_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  console.log(
    `📦 Découpage en ${totalChunks} chunks de ${Math.round(
      chunkSize / (1024 * 1024)
    )}MB`
  );

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    console.log(
      `📤 Upload chunk ${chunkIndex + 1}/${totalChunks} (${Math.round(
        chunk.size / 1024
      )}KB)`
    );

    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("uploadId", uploadId);
    formData.append("chunkIndex", chunkIndex.toString());
    formData.append("totalChunks", totalChunks.toString());
    formData.append("fileName", file.name);
    formData.append("fileType", file.type);

    const response = await fetch("/api/upload-chunk", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chunk ${chunkIndex + 1} échoué: ${errorText}`);
    }

    const result = await response.json();

    if (result.message?.includes("terminé")) {
      console.log("✅ Upload par chunks terminé avec succès");
      return result;
    }

    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} envoyé`);

    // Notifier du progrès des chunks
    onChunkProgress?.(chunkIndex + 1, totalChunks);
  }

  throw new Error("Upload par chunks incomplet");
}

// ---- FETCH SERVICES ----
export async function fetchPhotos(
  cursor?: string,
  limit = 20
): Promise<PaginatedResponse<MediaFile>> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append("cursor", cursor);

  const res = await fetch(`/api/photos?${params}`);
  if (!res.ok) throw new Error("Erreur récupération photos");
  return res.json();
}

export async function fetchVideos(
  cursor?: string,
  limit = 20
): Promise<PaginatedResponse<MediaFile>> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append("cursor", cursor);

  const res = await fetch(`/api/videos?${params}`);
  if (!res.ok) throw new Error("Erreur récupération vidéos");
  return res.json();
}
