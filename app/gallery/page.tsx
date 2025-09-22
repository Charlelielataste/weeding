// Page galerie dédiée
"use client";

import Link from "next/link";
import { Gallery } from "../../components/Gallery";

export default function GalleryPage() {
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
          href="/upload"
          className="bg-white/80 backdrop-blur rounded-xl px-4 py-2 shadow-lg hover:bg-white/90 transition-all"
        >
          📸 Upload
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
          Tous nos souvenirs partagés
        </p>
        <div className="flex justify-center space-x-1 mt-2">
          <span className="text-lg">🌸</span>
          <span className="text-lg">✨</span>
          <span className="text-lg">🌸</span>
        </div>
      </div>

      {/* Galerie principale */}
      <div className="px-4">
        <Gallery />
      </div>
    </div>
  );
}
