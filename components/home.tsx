"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

type MediaFile = {
  id: string;
  name: string;
  thumbnailLink: string;
  webViewLink: string;
};

type TabType = "photos" | "videos";

type ModalContent = {
  type: "photo" | "video";
  url: string;
  name: string;
} | null;

// ---- API CALLS ----
async function uploadPhoto(formData: FormData) {
  const res = await fetch("/api/upload-photo", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Erreur upload photo");
  return res.json();
}

async function uploadVideo(formData: FormData) {
  const res = await fetch("/api/upload-video", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Erreur upload vidéo");
  return res.json();
}

async function fetchPhotos(): Promise<MediaFile[]> {
  const res = await fetch("/api/photos");
  if (!res.ok) throw new Error("Erreur récupération photos");
  return res.json();
}

async function fetchVideos(): Promise<MediaFile[]> {
  const res = await fetch("/api/videos");
  if (!res.ok) throw new Error("Erreur récupération vidéos");
  return res.json();
}

export default function Home() {
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("photos");
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const MAX_FILES = 10; // Limite de 10 fichiers par upload

  // Photos
  const {
    data: photos,
    isLoading: photosLoading,
    isError: photosError,
  } = useQuery({
    queryKey: ["photos"],
    queryFn: fetchPhotos,
    refetchInterval: 30000, // auto-refresh toutes les 30s
  });

  // Videos
  const {
    data: videos,
    isLoading: videosLoading,
    isError: videosError,
  } = useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
    refetchInterval: 30000, // auto-refresh toutes les 30s
  });

  const handlePhotoUpload = async () => {
    if (photoFiles.length === 0) return;
    setIsUploading(true);

    try {
      for (const file of photoFiles) {
        const formData = new FormData();
        formData.append("file", file);
        await uploadPhoto(formData);
      }
      queryClient.invalidateQueries({ queryKey: ["photos"] });
      setPhotoFiles([]);
    } catch (error) {
      console.error("Erreur upload photos:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async () => {
    if (videoFiles.length === 0) return;
    setIsUploading(true);

    try {
      for (const file of videoFiles) {
        const formData = new FormData();
        formData.append("file", file);
        await uploadVideo(formData);
      }
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      setVideoFiles([]);
    } catch (error) {
      console.error("Erreur upload vidéos:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (
    files: FileList | null,
    type: "photo" | "video"
  ) => {
    if (!files) return;

    if (type === "photo") {
      const newFiles = Array.from(files).slice(0, MAX_FILES);
      setPhotoFiles((prev) => [...prev, ...newFiles].slice(0, MAX_FILES));
    } else {
      // Pour les vidéos, on ne prend que la première et on remplace
      const newFile = Array.from(files)[0];
      if (newFile) {
        setVideoFiles([newFile]);
      }
    }
  };

  const removeFile = (index: number, type: "photo" | "video") => {
    if (type === "photo") {
      setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const openModal = (file: MediaFile, type: "photo" | "video") => {
    setModalContent({
      type,
      url: file.webViewLink,
      name: file.name,
    });
    // Empêcher le scroll du body
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalContent(null);
    // Rétablir le scroll du body
    document.body.style.overflow = "unset";
  };

  // Nettoyer le scroll du body au démontage du composant
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <>
      {/* Background avec thème mariage */}
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-hidden">
        {/* Decoration florale en arrière-plan */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-6xl transform rotate-12">
            🌸
          </div>
          <div className="absolute top-32 right-16 text-4xl transform -rotate-12">
            🌹
          </div>
          <div className="absolute bottom-20 left-20 text-5xl transform rotate-45">
            💐
          </div>
          <div className="absolute bottom-32 right-12 text-3xl transform -rotate-45">
            🌺
          </div>
        </div>

        <div className="relative z-10 px-4 py-6">
          {/* Header romantique */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="text-2xl">💕</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Jo & Kevin
              </h1>
              <span className="text-2xl">💕</span>
            </div>
            <p className="text-lg text-gray-600 font-medium">
              Partagez vos plus beaux souvenirs
            </p>
            <div className="flex justify-center space-x-1 mt-2">
              <span className="text-lg">🌸</span>
              <span className="text-lg">✨</span>
              <span className="text-lg">🌸</span>
            </div>
          </div>

          {/* Section Upload */}
          <div className="max-w-lg mx-auto mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-100 p-6">
              {/* Upload Photos */}
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-2xl mr-2">📸</span>
                  <h3 className="text-xl font-semibold text-pink-700">
                    Photos
                  </h3>
                </div>

                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files, "photo")}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="border-2 border-dashed border-pink-200 rounded-xl p-6 text-center cursor-pointer hover:border-pink-300 transition-colors">
                    <span className="text-4xl mb-2 block">📷</span>
                    <p className="text-pink-600 font-medium">
                      Sélectionner des photos
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Jusqu&apos;à {MAX_FILES} photos
                    </p>
                  </div>
                </label>

                {/* Prévisualisation photos */}
                {photoFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {photoFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-pink-200"
                          />
                          <button
                            onClick={() => removeFile(index, "photo")}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handlePhotoUpload}
                      disabled={isUploading}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:from-pink-600 hover:to-rose-600 transition-all"
                    >
                      {isUploading
                        ? "⏳ Envoi en cours..."
                        : `💝 Envoyer ${photoFiles.length} photo(s)`}
                    </button>
                  </div>
                )}
              </div>

              {/* Séparateur décoratif */}
              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent"></div>
                <span className="px-3 text-pink-400">✨</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent"></div>
              </div>

              {/* Upload Vidéos */}
              <div>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-2xl mr-2">🎬</span>
                  <h3 className="text-xl font-semibold text-purple-700">
                    Vidéos
                  </h3>
                </div>

                <label className="block">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e.target.files, "video")}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-300 transition-colors">
                    <span className="text-4xl mb-2 block">🎥</span>
                    <p className="text-purple-600 font-medium">
                      Sélectionner une vidéo
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Une vidéo à la fois
                    </p>
                  </div>
                </label>

                {/* Prévisualisation vidéo */}
                {videoFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-xl">🎬</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm break-all">
                              {videoFiles[0].name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Vidéo sélectionnée
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <button
                          onClick={handleVideoUpload}
                          disabled={isUploading}
                          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:from-purple-600 hover:to-indigo-600 transition-all"
                        >
                          {isUploading
                            ? "⏳ Envoi en cours..."
                            : "🎊 Envoyer cette vidéo"}
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
              </div>
            </div>
          </div>

          {/* Galerie */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Nos souvenirs partagés
              </h2>
              <div className="flex justify-center space-x-1">
                <span className="text-lg">💫</span>
                <span className="text-lg">💕</span>
                <span className="text-lg">💫</span>
              </div>
            </div>

            {/* Onglets mariage */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-1 flex border border-pink-100">
                <button
                  onClick={() => setActiveTab("photos")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === "photos"
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                      : "text-gray-600 hover:text-pink-600"
                  }`}
                >
                  📸 Photos {photos && `(${photos.length})`}
                </button>
                <button
                  onClick={() => setActiveTab("videos")}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === "videos"
                      ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                      : "text-gray-600 hover:text-purple-600"
                  }`}
                >
                  🎬 Vidéos {videos && `(${videos.length})`}
                </button>
              </div>
            </div>

            {/* Contenu galerie */}
            {activeTab === "photos" && (
              <div>
                {photosLoading && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin text-4xl mb-4">
                      🌸
                    </div>
                    <p className="text-pink-600 font-medium">
                      Chargement des photos...
                    </p>
                  </div>
                )}
                {photosError && (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">😔</span>
                    <p className="text-red-600 font-medium">
                      Erreur chargement photos
                    </p>
                  </div>
                )}
                {photos && photos.length === 0 && (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📸</span>
                    <p className="text-gray-500 font-medium">
                      Aucune photo pour le moment
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Soyez les premiers à partager vos souvenirs !
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {photos?.map((photo) => (
                    <div
                      key={photo.id}
                      className="group cursor-pointer"
                      onClick={() => openModal(photo, "photo")}
                    >
                      <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white p-2">
                        <Image
                          src={photo.thumbnailLink}
                          alt={photo.name}
                          width={300}
                          height={192}
                          className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-2 bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-2xl">👁️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "videos" && (
              <div>
                {videosLoading && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-bounce text-4xl mb-4">
                      🎬
                    </div>
                    <p className="text-purple-600 font-medium">
                      Chargement des vidéos...
                    </p>
                  </div>
                )}
                {videosError && (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">😔</span>
                    <p className="text-red-600 font-medium">
                      Erreur chargement vidéos
                    </p>
                  </div>
                )}
                {videos && videos.length === 0 && (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">🎬</span>
                    <p className="text-gray-500 font-medium">
                      Aucune vidéo pour le moment
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Partagez vos plus beaux moments !
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {videos?.map((video) => (
                    <div
                      key={video.id}
                      className="group cursor-pointer"
                      onClick={() => openModal(video, "video")}
                    >
                      <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white p-2">
                        <div className="relative w-full h-48 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
                          <span className="text-4xl">🎬</span>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-3xl">▶️</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour visualisation */}
      {modalContent && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden"
          onClick={closeModal}
          style={{ touchAction: "none" }}
        >
          {/* Bouton fermer */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-20 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
          >
            ✕
          </button>

          {/* Contenu modal */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {modalContent.type === "photo" ? (
              <Image
                src={modalContent.url}
                alt={modalContent.name}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: "calc(100vh - 2rem)" }}
              />
            ) : (
              <video
                src={modalContent.url}
                controls
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: "calc(100vh - 2rem)" }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
