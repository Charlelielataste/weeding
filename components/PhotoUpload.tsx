// Composant pour l'upload des photos
"use client";

import { useState } from "react";
import { validatePhotos, MAX_PHOTOS } from "../utils/fileValidation";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { useUploadProtection } from "../hooks/useUploadProtection";
import { ProgressBar } from "./ProgressBar";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";

export function PhotoUpload() {
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const { uploadState, uploadPhotos } = usePhotoUpload();
  const { toast, hideToast, showSuccess, showError } = useToast();

  // Protection contre la perte d'upload
  const { isProtected } = useUploadProtection({
    isUploading: uploadState.isUploading,
    message:
      "🚫 Upload de photos en cours ! Vous allez perdre votre progression si vous quittez maintenant. Continuer ?",
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validation = validatePhotos(newFiles, photoFiles.length);

    if (validation.errors.length > 0) {
      alert(validation.errors.join("\n"));
      return;
    }

    if (validation.validFiles.length > 0) {
      setPhotoFiles((prev) => [...prev, ...validation.validFiles]);
    }
  };

  const handleUpload = () => {
    uploadPhotos(photoFiles, showSuccess, showError).then(() => {
      setPhotoFiles([]);
    });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-center mb-4">
        <span className="text-2xl mr-2">📸</span>
        <h3 className="text-xl font-semibold text-pink-700">Photos</h3>
      </div>

      <label className="block">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploadState.isUploading}
        />
        <div className="border-2 border-dashed border-pink-200 rounded-xl p-6 text-center cursor-pointer hover:border-pink-300 transition-colors">
          <span className="text-4xl mb-2 block">📷</span>
          <p className="text-pink-600 font-medium">Sélectionner des photos</p>
          <p className="text-sm text-gray-500 mt-1">
            Max {MAX_PHOTOS} photos par envoi
          </p>
        </div>
      </label>

      {/* Compteur photos */}
      {photoFiles.length > 0 && (
        <div className="mt-4">
          <div className="bg-pink-50 rounded-xl p-4 border border-pink-200 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-2xl">📸</span>
              <p className="font-medium text-gray-800">
                {photoFiles.length} photo(s) sélectionnée(s)
              </p>
            </div>
            <div className="flex justify-between gap-2">
              <button
                onClick={handleUpload}
                disabled={uploadState.isUploading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:from-pink-600 hover:to-rose-600 transition-all"
              >
                {uploadState.isUploading
                  ? "⏳ Envoi en cours..."
                  : `💝 Envoyer ${photoFiles.length} photo(s)`}
              </button>
              <button
                onClick={() => setPhotoFiles([])}
                className="text-gray-400 hover:text-red-500 transition-colors bg-pink-100 rounded-xl py-2 px-4"
              >
                <span className="text-lg">🗑️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre de progression photos */}
      <ProgressBar
        uploadState={uploadState}
        type="photos"
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
