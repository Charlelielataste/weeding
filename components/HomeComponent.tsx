"use client";

import Link from "next/link";
import { RefObject, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function HomeComponent() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isJohannaTransformed, setIsJohannaTransformed] = useState(false);
  const [isKevinTransformed, setIsKevinTransformed] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isComponentDisappearing, setIsComponentDisappearing] = useState(false);
  const [isJohannaDisappearing, setIsJohannaDisappearing] = useState(false);
  const [isKevinDisappearing, setIsKevinDisappearing] = useState(false);
  const [showJohannaEmoji, setShowJohannaEmoji] = useState(false);
  const [showKevinEmoji, setShowKevinEmoji] = useState(false);

  const handlePlay = (ref: RefObject<HTMLAudioElement | null>) => {
    if (ref.current) {
      ref.current.currentTime = 0; // remet au début
      ref.current.play().catch(() => {
        // Ignore les erreurs de lecture automatique
      });
    }
  };

  const handleJohannaClick = () => {
    if (!isJohannaTransformed) {
      setIsJohannaDisappearing(true);

      // Délai pour la disparition du texte
      setTimeout(() => {
        setIsJohannaTransformed(true);
        setShowJohannaEmoji(true);
        // Vérifier si les deux sont transformés
        if (isKevinTransformed) {
          checkBothTransformed();
        }
      }, 300);
    }
  };

  const handleKevinClick = () => {
    if (!isKevinTransformed) {
      setIsKevinDisappearing(true);

      // Délai pour la disparition du texte
      setTimeout(() => {
        setIsKevinTransformed(true);
        setShowKevinEmoji(true);
        // Vérifier si les deux sont transformés
        if (isJohannaTransformed) {
          checkBothTransformed();
        }
      }, 300);
    }
  };

  const checkBothTransformed = () => {
    // Délai de 3 secondes avant la disparition magique
    setTimeout(() => {
      handlePlay(audioRef);
      setIsComponentDisappearing(true);
      // Délai supplémentaire pour l'effet de disparition
      setTimeout(() => {
        setShowVideo(true);
        // Jouer le son quand la vidéo apparaît
      }, 1000);
    }, 2000);
  };

  // Si la vidéo doit être affichée, on affiche seulement la vidéo avec le bouton refresh

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-4"
      initial={{
        background: "linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%)",
      }}
      animate={{
        background: isComponentDisappearing
          ? "linear-gradient(135deg, #581c87 0%, #000000 100%)"
          : "linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 100%)",
      }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <audio ref={audioRef} src="/zelda_secret.mp3" />
      {showVideo ? (
        <motion.div
          className="text-center max-w-2xl mx-auto px-4 w-full"
          initial={{ opacity: 0, scale: 0.5, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="mb-8">
            <motion.button
              onClick={() => {
                setShowVideo(false);
                setIsComponentDisappearing(false);
                setIsJohannaTransformed(false);
                setIsKevinTransformed(false);
                setIsJohannaDisappearing(false);
                setIsKevinDisappearing(false);
                setShowJohannaEmoji(false);
                setShowKevinEmoji(false);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg"
              transition={{ type: "spring", stiffness: 300 }}
            >
              🔄 Recommencer
            </motion.button>
            <div className="bg-black rounded-2xl p-4 mt-6">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <video src="/video.mp4" autoPlay loop />
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="text-center max-w-2xl mx-auto px-4 w-full"
          initial={{ opacity: 1, scale: 1, y: 0 }}
          animate={
            isComponentDisappearing
              ? {
                  opacity: 0,
                  scale: 0.8,
                  y: -50,
                  rotateX: 15,
                }
              : {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  rotateX: 0,
                }
          }
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {/* Header principal */}
          <div className="mb-12">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="text-4xl">💕</span>
              <div>
                <h1 className="text-5xl font-bold gap-2 flex flex-col items-center justify-center">
                  {/* Johanna */}
                  <div className="w-52 flex justify-center">
                    {showJohannaEmoji ? (
                      <motion.div
                        className="text-5xl"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          duration: 0.5,
                          ease: "easeOut",
                        }}
                        whileInView={{
                          y: [0, -8, 0],
                          transition: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                        }}
                      >
                        👰
                      </motion.div>
                    ) : (
                      <motion.button
                        onClick={handleJohannaClick}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
                        initial={{ opacity: 1, scale: 1, rotate: 0 }}
                        animate={
                          isJohannaDisappearing
                            ? {
                                opacity: 0,
                              }
                            : {
                                opacity: 1,
                              }
                        }
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        Johanna
                      </motion.button>
                    )}
                  </div>

                  <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent text-4xl">
                    &
                  </span>

                  {/* Kevin */}
                  <div className="w-52 flex justify-center">
                    {showKevinEmoji ? (
                      <motion.div
                        className="text-5xl"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          duration: 0.5,
                          ease: "easeOut",
                        }}
                        whileInView={{
                          y: [0, -8, 0],
                          transition: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                        }}
                      >
                        🤵
                      </motion.div>
                    ) : (
                      <motion.button
                        onClick={handleKevinClick}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
                        initial={{ opacity: 1, scale: 1, rotate: 0 }}
                        animate={
                          isKevinDisappearing
                            ? {
                                opacity: 0,
                              }
                            : {
                                opacity: 1,
                              }
                        }
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        Kevin
                      </motion.button>
                    )}
                  </div>
                </h1>
              </div>
              <span className="text-4xl">💕</span>
            </div>
            <p className="text-xl text-gray-600 font-medium mb-4">
              Partagez vos plus beaux souvenirs de notre mariage
            </p>
            <div className="flex justify-center space-x-2">
              <span className="text-2xl">🌸</span>
              <span className="text-2xl">✨</span>
              <span className="text-2xl">💐</span>
              <span className="text-2xl">✨</span>
              <span className="text-2xl">🌸</span>
            </div>
          </div>

          {/* Navigation principale */}
          <div className="space-y-4 max-w-md mx-auto">
            <Link
              href="/upload"
              className="block bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 px-8 rounded-2xl font-semibold text-lg transition-all shadow-lg"
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">📸</span>
                <span>Ajouter Photos & Vidéos</span>
                <span className="text-2xl">🎬</span>
              </div>
            </Link>

            <Link
              href="/gallery"
              className="block bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 px-8 rounded-2xl font-semibold text-lg transition-all shadow-lg"
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🎭</span>
                <span>Voir la Galerie</span>
                <span className="text-2xl">🖼️</span>
              </div>
            </Link>
          </div>

          {/* Informations supplémentaires */}
          <div className="max-w-md mx-auto">
            <div className="mt-12 p-4 bg-white/60 backdrop-blur rounded-2xl border border-pink-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Comment ça marche ?
              </h3>
              <div className="text-sm text-gray-600 space-y-2 text-left">
                <p>
                  📱 <strong>Upload :</strong> Ajoutez vos photos et vidéos
                </p>
                <p>
                  🎨 <strong>Galerie :</strong> Découvrez tous les souvenirs
                  partagés
                </p>
                <p>💝 N&apos;hésitez pas à leur laisser un message vidéo</p>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="mt-8 text-xs text-gray-400">
            <p>Merci de partager ces moments magiques avec nous ! 🥂</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
