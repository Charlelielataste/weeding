// Composant galerie pour afficher photos et vidéos
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  useInfinitePhotos,
  useInfiniteVideos,
} from "../hooks/useInfiniteScroll";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import {
  MediaFile,
  TabType,
  ModalContent,
  WindowWithModalHandler,
} from "../types";
import VideoPlayIcon from "@/components/icons/PlayIcon";

export function Gallery() {
  const [activeTab, setActiveTab] = useState<TabType>("photos");
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Photos avec infinite scroll
  const {
    data: photosData,
    isLoading: photosLoading,
    isError: photosError,
    fetchNextPage: fetchNextPhotosPage,
    hasNextPage: hasNextPhotosPage,
    isFetchingNextPage: isFetchingNextPhotosPage,
  } = useInfinitePhotos(20);

  // Videos avec infinite scroll
  const {
    data: videosData,
    isLoading: videosLoading,
    isError: videosError,
    fetchNextPage: fetchNextVideosPage,
    hasNextPage: hasNextVideosPage,
    isFetchingNextPage: isFetchingNextVideosPage,
  } = useInfiniteVideos(20);

  // Intersection Observer pour détecter le scroll
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "200px",
  });

  // Flatten des données paginées
  const photos = photosData?.pages.flatMap((page) => page.data) || [];
  const videos = videosData?.pages.flatMap((page) => page.data) || [];

  // Auto-load when scrolling
  useEffect(() => {
    if (isIntersecting) {
      if (
        activeTab === "photos" &&
        hasNextPhotosPage &&
        !isFetchingNextPhotosPage
      ) {
        console.log("🔄 Chargement page suivante photos...");
        fetchNextPhotosPage();
      } else if (
        activeTab === "videos" &&
        hasNextVideosPage &&
        !isFetchingNextVideosPage
      ) {
        console.log("🔄 Chargement page suivante vidéos...");
        fetchNextVideosPage();
      }
    }
  }, [
    isIntersecting,
    activeTab,
    hasNextPhotosPage,
    isFetchingNextPhotosPage,
    hasNextVideosPage,
    isFetchingNextVideosPage,
    fetchNextPhotosPage,
    fetchNextVideosPage,
  ]);

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
    <div className="max-w-2xl mx-auto mt-10">
      {/* Onglets */}
      <div ref={tabsRef} className="flex justify-center mb-6">
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
          {photos && photos.length === 0 && !photosLoading && (
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
          {videos && videos.length === 0 && !videosLoading && (
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
          <div className="grid grid-cols-2 gap-3">
            {videos?.map((video) => (
              <div
                key={video.id}
                className="cursor-pointer"
                onClick={() => openModal(video, "video")}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white p-2">
                  {/* Thumbnail ou icône par défaut */}
                  <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100">
                    {video.thumbnailLink &&
                    video.thumbnailLink !== video.webViewLink ? (
                      <Image
                        src={video.thumbnailLink}
                        alt={video.name}
                        width={300}
                        height={192}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl group-hover:scale-110 transition-transform">
                          🎬
                        </span>
                      </div>
                    )}

                    {/* Overlay de play */}
                    <div className="absolute inset-0 bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-2xl">
                        <VideoPlayIcon className="size-7" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load More Trigger & Loading States */}
      <div ref={loadMoreRef} className="py-8 text-center">
        {activeTab === "photos" ? (
          <>
            {isFetchingNextPhotosPage && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin text-2xl">🌸</div>
                <p className="text-pink-600 font-medium">
                  Chargement de plus de photos...
                </p>
              </div>
            )}
            {!hasNextPhotosPage && photos.length > 0 && (
              <p className="text-gray-500 text-sm">
                🎭 Toutes les photos ont été chargées !
              </p>
            )}
          </>
        ) : (
          <>
            {isFetchingNextVideosPage && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin text-2xl">🎬</div>
                <p className="text-purple-600 font-medium">
                  Chargement de plus de vidéos...
                </p>
              </div>
            )}
            {!hasNextVideosPage && videos.length > 0 && (
              <p className="text-gray-500 text-sm">
                🎭 Toutes les vidéos ont été chargées !
              </p>
            )}
          </>
        )}
      </div>

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
