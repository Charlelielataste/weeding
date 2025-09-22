// Composant pour l'upload des vidéos
"use client";

import { useState } from "react";
import {
  validateVideos,
  calculateVideoTotalSize,
  MAX_VIDEO_SIZE_TOTAL,
} from "../utils/fileValidation";
import { useVideoUpload } from "../hooks/useVideoUpload";
import { ProgressBar } from "./ProgressBar";
import {
  generateVideoThumbnail,
  cleanupThumbnails,
} from "../utils/videoThumbnail";
import { FileWithThumbnail } from "../types";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";

export function VideoUpload() {
  const [videoFiles, setVideoFiles] = useState<FileWithThumbnail[]>([]);
  const { uploadState, uploadVideos } = useVideoUpload();
  const { toast, hideToast, showSuccess, showError } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validation = validateVideos(newFiles, videoFiles);

    if (validation.errors.length > 0) {
      alert(validation.errors.join("\n"));
      return;
    }

    if (validation.validFiles.length > 0) {
      console.log("📹 Génération des thumbnails...");

      // Générer les thumbnails pour chaque vidéo
      const filesWithThumbnails: FileWithThumbnail[] = [];

      for (const file of validation.validFiles) {
        try {
          console.log(`🖼️ Génération thumbnail pour: ${file.name}`);
          const thumbnailUrl = await generateVideoThumbnail(file, 1); // 1 seconde

          const fileWithThumbnail: FileWithThumbnail = Object.assign(file, {
            thumbnailUrl,
          });

          filesWithThumbnails.push(fileWithThumbnail);

          console.log(`✅ Thumbnail généré pour: ${file.name}`);
        } catch (error) {
          console.warn(
            `⚠️ Impossible de générer thumbnail pour ${file.name}:`,
            error
          );
          // Ajouter le fichier sans thumbnail
          filesWithThumbnails.push(file);
        }
      }

      setVideoFiles((prev) => [...prev, ...filesWithThumbnails]);
    }
  };

  const handleUpload = () => {
    uploadVideos(videoFiles, showSuccess, showError).then(() => {
      // Nettoyer tous les thumbnails avant de vider
      cleanupThumbnails(
        videoFiles.map((f) => f.thumbnailUrl).filter(Boolean) as string[]
      );
      setVideoFiles([]);
    });
  };

  const removeFile = (index: number) => {
    setVideoFiles((prev) => {
      const fileToRemove = prev[index];
      // Nettoyer le thumbnail s'il existe
      if (fileToRemove.thumbnailUrl) {
        URL.revokeObjectURL(fileToRemove.thumbnailUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const { totalSizeMB, maxSizeMB, percentage } =
    calculateVideoTotalSize(videoFiles);

  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <span className="text-2xl mr-2">🎬</span>
        <h3 className="text-xl font-semibold text-purple-700">Vidéos</h3>
      </div>

      <label className="block">
        <input
          type="file"
          accept="video/mp4,video/mov,video/avi,video/webm,video/3gp"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploadState.isUploading}
        />
        <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-300 transition-colors">
          <span className="text-4xl mb-2 block">🎥</span>
          <p className="text-purple-600 font-medium">Sélectionner des vidéos</p>
          <p className="text-sm text-gray-500 mt-1">
            300MB total • MP4, MOV, AVI, WebM, 3GP • Aucune limite par fichier
          </p>
        </div>
      </label>

      {/* Compteur vidéos */}
      {videoFiles.length > 0 && (
        <div className="mt-4">
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="text-center mb-3">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="text-2xl">🎬</span>
                <p className="font-medium text-gray-800">
                  {videoFiles.length} vidéo(s) sélectionnée(s)
                </p>
              </div>
              <div className="text-xs text-gray-600">
                <span
                  className={
                    percentage > 90
                      ? "text-red-500 font-semibold"
                      : percentage > 70
                      ? "text-orange-500"
                      : "text-gray-600"
                  }
                >
                  {totalSizeMB}MB / {maxSizeMB}MB ({Math.round(percentage)}%)
                </span>
              </div>
            </div>

            {/* Liste des vidéos avec thumbnails */}
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {videoFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white rounded-lg p-2"
                >
                  <div className="flex items-center space-x-3">
                    {/* Thumbnail ou icône par défaut */}
                    <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                      {file.thumbnailUrl ? (
                        <img
                          src={file.thumbnailUrl}
                          alt={`Aperçu ${file.name}`}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">🎬</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(file.size / (1024 * 1024))}MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-600 text-sm ml-2 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-2">
              <button
                onClick={handleUpload}
                disabled={uploadState.isUploading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:from-purple-600 hover:to-indigo-600 transition-all"
              >
                {uploadState.isUploading
                  ? "⏳ Envoi en cours..."
                  : `🎊 Envoyer ${videoFiles.length} vidéo(s)`}
              </button>
              <button
                onClick={() => {
                  // Nettoyer tous les thumbnails avant de vider
                  cleanupThumbnails(
                    videoFiles
                      .map((f) => f.thumbnailUrl)
                      .filter(Boolean) as string[]
                  );
                  setVideoFiles([]);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors bg-purple-100 rounded-xl py-2 px-4"
              >
                <span className="text-lg shrink-0">🗑️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre de progression vidéos */}
      <ProgressBar uploadState={uploadState} type="videos" />

      {/* Toast de notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
