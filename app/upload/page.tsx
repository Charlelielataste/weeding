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
          className="bg-white/80 backdrop-blur text-purple-600 rounded-xl px-4 py-2 shadow-lg transition-all"
        >
          Accueil
        </Link>
      </nav>

      <nav className="fixed top-4 right-4 z-50">
        <Link
          href="/gallery"
          className="bg-white/80 backdrop-blur text-pink-600 rounded-xl px-4 py-2 shadow-lg transition-all"
        >
          🖼️ Galerie
        </Link>
      </nav>

      {/* Section Upload */}
      <div className="max-w-lg mx-auto mb-8 mt-10">
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
