// Hook personnalisé pour gérer l'upload des photos
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadPhoto } from "../services/api";
import { UploadProgressState } from "../types";

export function usePhotoUpload() {
  const [uploadState, setUploadState] = useState<UploadProgressState>({
    progress: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    currentFileName: "",
    isUploading: false,
  });

  const queryClient = useQueryClient();

  const uploadPhotos = async (files: File[]) => {
    if (files.length === 0) return;

    setUploadState({
      progress: 0,
      currentFileIndex: 0,
      totalFiles: files.length,
      currentFileName: "",
      isUploading: true,
    });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        setUploadState((prev) => ({
          ...prev,
          currentFileIndex: i + 1,
          currentFileName: file.name,
        }));

        const formData = new FormData();
        formData.append("file", file);
        await uploadPhoto(formData);

        // Mettre à jour la progression
        const progress = ((i + 1) / files.length) * 100;
        setUploadState((prev) => ({
          ...prev,
          progress,
        }));
      }

      // Rafraîchir la liste des photos
      queryClient.invalidateQueries({ queryKey: ["photos"] });

      alert(`🎉 ${files.length} photo(s) uploadée(s) avec succès !`);
    } catch (error) {
      console.error("Erreur upload photos:", error);
      alert(
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
