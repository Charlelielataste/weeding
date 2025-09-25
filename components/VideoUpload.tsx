// Composant pour l'upload des vidéos
"use client";

import { useState } from "react";
import {
  validateVideos,
  calculateVideoTotalSize,
} from "../utils/fileValidation";
import { useVideoUpload } from "../hooks/useVideoUpload";
import { useUploadProtection } from "../hooks/useUploadProtection";
import { ProgressBar } from "./ProgressBar";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";

export function VideoUpload() {
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const { uploadState, uploadVideos } = useVideoUpload();
  const { toast, hideToast, showSuccess, showError } = useToast();

  // Protection contre la perte d'upload
  const { isProtected } = useUploadProtection({
    isUploading: uploadState.isUploading,
    message:
      "🚫 Upload de vidéos en cours ! Vous allez perdre votre progression si vous quittez maintenant. Continuer ?",
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validation = validateVideos(newFiles, videoFiles);

    if (validation.errors.length > 0) {
      alert(validation.errors.join("\n"));
      return;
    }

    if (validation.validFiles.length > 0) {
      setVideoFiles((prev) => [...prev, ...validation.validFiles]);
    }
  };

  const handleUpload = () => {
    uploadVideos(videoFiles, showSuccess, showError).then(() => {
      setVideoFiles([]);
    });
  };

  const { totalSizeMB, maxSizeMB, percentage } =
    calculateVideoTotalSize(videoFiles);

  return (
    <div>
      <label className="block">
        <input
          type="file"
          accept="video/mp4,video/mov,video/avi,video/webm,video/3gp"
          multiple
          onChange={(e) => {
            handleFileSelect(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
          disabled={uploadState.isUploading}
        />
        <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-300 transition-colors">
          <span className="text-4xl mb-2 block">🎥</span>
          <p className="text-purple-600 font-medium">Sélectionner des vidéos</p>
          <p className="text-sm text-gray-500 mt-1">
            300MB total • MP4, MOV, AVI, WebM, 3GP
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
      <ProgressBar
        uploadState={uploadState}
        type="videos"
        isProtected={isProtected}
      />

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
