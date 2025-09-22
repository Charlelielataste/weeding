// Page dédiée à l'upload
"use client";

import Link from "next/link";
import { PhotoUpload } from "../../components/PhotoUpload";
import { VideoUpload } from "../../components/VideoUpload";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      {/* Navigation */}
      <nav className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="bg-white/80 backdrop-blur rounded-xl px-4 py-2 shadow-lg hover:bg-white/90 transition-all"
        >
          ← Accueil
        </Link>
      </nav>

      <nav className="fixed top-4 right-4 z-50">
        <Link
          href="/gallery"
          className="bg-white/80 backdrop-blur rounded-xl px-4 py-2 shadow-lg hover:bg-white/90 transition-all"
        >
          🎬 Galerie
        </Link>
      </nav>

      {/* Header */}
      <div className="text-center mb-8 pt-16">
        <div className="inline-flex items-center space-x-2 mb-4">
          <span className="text-2xl">💕</span>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Johanna & Kevin
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
          <PhotoUpload />

          {/* Séparateur décoratif */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent"></div>
            <span className="px-3 text-pink-400">✨</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent"></div>
          </div>

          {/* Upload Vidéos */}
          <VideoUpload />
        </div>
      </div>
    </div>
  );
}
