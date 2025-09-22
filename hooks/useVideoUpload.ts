// Hook personnalisé pour gérer l'upload des vidéos
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadVideoWithPresignedUrl } from "../services/api";
import { UploadProgressState } from "../types";

export function useVideoUpload() {
  const [uploadState, setUploadState] = useState<UploadProgressState>({
    progress: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    currentFileName: "",
    isUploading: false,
  });

  const queryClient = useQueryClient();

  const uploadVideos = async (files: File[]) => {
    if (files.length === 0) return;

    setUploadState({
      progress: 0,
      currentFileIndex: 0,
      totalFiles: files.length,
      currentFileName: "",
      isUploading: true,
    });

    let successCount = 0;
    const errorDetails: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        setUploadState((prev) => ({
          ...prev,
          currentFileIndex: i + 1,
          currentFileName: file.name,
        }));

        try {
          console.log(`🚀 Upload vidéo ${i + 1}/${files.length}:`, {
            name: file.name,
            type: file.type,
            size: `${Math.round(file.size / (1024 * 1024))}MB`,
            lastModified: new Date(file.lastModified).toISOString(),
          });

          // Vérifications avant upload
          console.log("🔍 Vérifications pré-upload:", {
            isFile: file instanceof File,
            hasName: !!file.name,
            hasSize: file.size > 0,
            hasType: !!file.type,
          });

          console.log("📤 Upload direct vers B2...");
          const startTime = Date.now();

          const response = await uploadVideoWithPresignedUrl(file);

          const uploadTime = Date.now() - startTime;
          console.log(
            `✅ Upload ${i + 1} réussi en ${uploadTime}ms:`,
            response
          );

          successCount++;

          // Mettre à jour la progression
          const progress = ((i + 1) / files.length) * 100;
          setUploadState((prev) => ({
            ...prev,
            progress,
          }));
        } catch (fileError) {
          const errorMsg =
            fileError instanceof Error ? fileError.message : String(fileError);
          console.error(`❌ Erreur upload fichier "${file.name}":`, fileError);

          errorDetails.push(`"${file.name}": ${errorMsg}`);

          // Mettre à jour la progression même en cas d'erreur
          const progress = ((i + 1) / files.length) * 100;
          setUploadState((prev) => ({
            ...prev,
            progress,
          }));
        }
      }

      // Rafraîchir la liste des vidéos même si certains uploads ont échoué
      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ["videos"] });
      }

      // Afficher le résultat
      if (successCount === files.length) {
        alert(`🎉 ${successCount} vidéo(s) uploadée(s) avec succès !`);
      } else if (successCount > 0) {
        alert(
          `⚠️ Résultat mixte:\n✅ ${successCount} vidéo(s) réussie(s)\n❌ ${
            errorDetails.length
          } échec(s):\n\n${errorDetails.join("\n")}`
        );
      } else {
        throw new Error(
          `Tous les uploads ont échoué:\n${errorDetails.join("\n")}`
        );
      }
    } catch (error) {
      console.error("❌ Erreur générale upload vidéos:", error);

      let debugInfo = "\n\n🔍 INFOS DEBUG:\n";
      debugInfo += `• Nombre de fichiers: ${files.length}\n`;
      debugInfo += `• Navigateur: ${navigator.userAgent.split(" ").pop()}\n`;
      debugInfo += `• Connexion: ${
        (navigator as any).connection?.effectiveType || "inconnue"
      }\n`;
      debugInfo += `• Taille totale: ${Math.round(
        files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)
      )}MB\n`;

      if (files.length > 0) {
        debugInfo += `• Premier fichier:\n`;
        debugInfo += `  - Nom: ${files[0].name}\n`;
        debugInfo += `  - Type: ${files[0].type}\n`;
        debugInfo += `  - Taille: ${Math.round(
          files[0].size / (1024 * 1024)
        )}MB\n`;
      }

      if (errorDetails.length > 0) {
        debugInfo += `• Erreurs détaillées:\n${errorDetails
          .map((e) => `  - ${e}`)
          .join("\n")}\n`;
      }

      alert(
        `❌ Erreur lors de l'upload des vidéos !\n\n${
          error instanceof Error ? error.message : "Erreur inconnue"
        }${debugInfo}\n\n💡 Essayez:\n• Une vidéo à la fois\n• Vérifiez votre connexion\n• Réduisez la taille si > 500MB`
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
    uploadVideos,
  };
}
