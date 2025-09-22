// Composant galerie pour afficher photos et vidéos
"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { fetchPhotos, fetchVideos } from "../services/api";
import {
  MediaFile,
  TabType,
  ModalContent,
  WindowWithModalHandler,
} from "../types";

export function Gallery() {
  const [activeTab, setActiveTab] = useState<TabType>("photos");
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

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

  const handleTabChange = (tab: TabType) => {
    // Sauvegarder la position actuelle des onglets avant le changement
    const tabsPosition = tabsRef.current?.offsetTop || 0;

    setActiveTab(tab);

    // Après le changement d'onglet, restaurer la position
    setTimeout(() => {
      if (tabsRef.current) {
        const adjustment = 80; // Ajustement pour compenser les marges/headers
        window.scrollTo({
          top: tabsPosition - adjustment,
          behavior: "smooth",
        });
      }
    }, 50);
  };

  const openModal = (media: MediaFile, type: "photo" | "video") => {
    const content: ModalContent = {
      type,
      url: media.webViewLink,
      name: media.name,
    };
    setModalContent(content);

    // Ajouter un état dans l'historique du navigateur
    window.history.pushState({ modal: true }, "");

    // Gérer le bouton retour pour fermer la modal
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setModalContent(null);
      window.removeEventListener("popstate", handlePopState);
    };

    window.addEventListener("popstate", handlePopState);
    (window as WindowWithModalHandler).modalBackHandler = handlePopState;
  };

  const closeModal = () => {
    setModalContent(null);
    // Retourner en arrière dans l'historique pour annuler l'état modal
    if ((window as WindowWithModalHandler).modalBackHandler) {
      window.removeEventListener(
        "popstate",
        (window as WindowWithModalHandler).modalBackHandler!
      );
      (window as WindowWithModalHandler).modalBackHandler = undefined;
    }
    if (window.history.state?.modal) {
      window.history.back();
    }
  };

  // Cleanup des event listeners au démontage du composant
  useEffect(() => {
    return () => {
      if ((window as WindowWithModalHandler).modalBackHandler) {
        window.removeEventListener(
          "popstate",
          (window as WindowWithModalHandler).modalBackHandler!
        );
      }
    };
  }, []);

  return (
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

      {/* Onglets */}
      <div ref={tabsRef} className="flex justify-center mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-1 flex border border-pink-100">
          <button
            onClick={() => handleTabChange("photos")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "photos"
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                : "text-gray-600 hover:text-pink-600"
            }`}
          >
            📸 Photos {photos && `(${photos.length})`}
          </button>
          <button
            onClick={() => handleTabChange("videos")}
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
              <div className="inline-block animate-spin text-4xl mb-4">🌸</div>
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
                    loading="lazy"
                  />
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
              <div className="inline-block animate-spin text-4xl mb-4">🎬</div>
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
                Soyez les premiers à partager vos vidéos !
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos?.map((video) => (
              <div
                key={video.id}
                className="group cursor-pointer"
                onClick={() => openModal(video, "video")}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white p-3 hover:shadow-xl transition-shadow">
                  <div className="relative bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl h-48 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-5xl mb-2 block group-hover:scale-110 transition-transform">
                        🎬
                      </span>
                      <p className="text-sm font-medium text-gray-700 truncate max-w-40 mx-auto">
                        {video.name}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-2xl">▶️</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalContent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute -top-10 right-0 text-white text-xl bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            >
              ✕
            </button>

            {modalContent.type === "photo" ? (
              <Image
                src={modalContent.url}
                alt={modalContent.name}
                width={800}
                height={600}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            ) : (
              <video
                src={modalContent.url}
                controls
                className="max-w-full max-h-[90vh] rounded-lg"
                autoPlay
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
