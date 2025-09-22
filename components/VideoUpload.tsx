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

export function VideoUpload() {
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const { uploadState, uploadVideos } = useVideoUpload();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validation = validateVideos(newFiles, videoFiles);

    if (validation.errors.length > 0) {
      alert(validation.errors.join("\n"));
      return;
    }

    if (validation.validFiles.length > 0) {
      console.log(
        "📹 Vidéos sélectionnées:",
        validation.validFiles.map((f) => ({
          name: f.name,
          type: f.type,
          size: `${Math.round(f.size / (1024 * 1024))}MB`,
        }))
      );

      setVideoFiles((prev) => [...prev, ...validation.validFiles]);
    }
  };

  const handleUpload = () => {
    uploadVideos(videoFiles).then(() => {
      setVideoFiles([]);
    });
  };

  const removeFile = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
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
            200MB total • MP4, MOV, AVI, WebM, 3GP
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

            {/* Liste des vidéos */}
            <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
              {videoFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white rounded-lg p-2"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🎬</span>
                    <div>
                      <p className="text-xs font-medium text-gray-800 truncate max-w-40">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(file.size / (1024 * 1024))}MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-600 text-sm"
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
                onClick={() => setVideoFiles([])}
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
    </div>
  );
}
