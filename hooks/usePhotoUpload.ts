// Hook personnalisé pour gérer l'upload des photos
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadPhoto } from "../services/api";
import { UploadProgressState } from "../types";
import { processFilesWithHEICConversion } from "../utils/heicConverter";
export function usePhotoUpload() {
  const [uploadState, setUploadState] = useState<UploadProgressState>({
    progress: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    currentFileName: "",
    isUploading: false,
  });

  const queryClient = useQueryClient();

  const uploadPhotos = async (
    files: File[],
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ) => {
    if (files.length === 0) return;

    setUploadState({
      progress: 0,
      currentFileIndex: 0,
      totalFiles: files.length,
      currentFileName: "Préparation des fichiers...",
      isUploading: true,
    });

    try {
      // Étape 1: Convertir les fichiers HEIC si nécessaire
      setUploadState((prev) => ({
        ...prev,
        currentFileName: "Conversion des fichiers HEIC...",
      }));

      const processedFiles = await processFilesWithHEICConversion(
        files,
        (current, total, fileName) => {
          setUploadState((prev) => ({
            ...prev,
            currentFileName: `Conversion: ${fileName}`,
            progress: (current / total) * 30, // 30% pour la conversion
          }));
        }
      );

      // Étape 2: Upload des fichiers traités
      for (let i = 0; i < processedFiles.length; i++) {
        const file = processedFiles[i];

        setUploadState((prev) => ({
          ...prev,
          currentFileIndex: i + 1,
          currentFileName: file.name,
          progress: 30 + ((i + 1) / processedFiles.length) * 70, // 70% pour l'upload
        }));

        const formData = new FormData();
        formData.append("file", file);
        await uploadPhoto(formData);
      }

      // Rafraîchir la liste des photos
      queryClient.invalidateQueries({ queryKey: ["photos"] });

      const hasHEICFiles = files.some(
        (f) =>
          f.name.toLowerCase().includes(".heic") ||
          f.name.toLowerCase().includes(".heif")
      );
      const message = hasHEICFiles
        ? `🎉 ${files.length} photo(s) uploadée(s) avec succès ! (Fichiers HEIC convertis automatiquement)`
        : `🎉 ${files.length} photo(s) uploadée(s) avec succès !`;

      onSuccess?.(message);
    } catch (error) {
      console.error("Erreur upload photos:", error);
      onError?.(
        `❌ Erreur lors de l'upload des photos: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setUploadState({
        progress: 0,
        currentFileIndex: 0,
        totalFiles: 0,
        currentFileName: "",
        isUploading: false,
      });
    }
  };

  return {
    uploadState,
    uploadPhotos,
  };
}
