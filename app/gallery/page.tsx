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
          className="bg-white/80 backdrop-blur text-purple-600 rounded-xl px-4 py-2 shadow-lg transition-all"
        >
          Accueil
        </Link>
      </nav>

      <nav className="fixed top-4 right-4 z-50">
        <Link
          href="/upload"
          className="bg-white/80 backdrop-blur text-pink-600 rounded-xl px-4 py-2 shadow-lg transition-all"
        >
          📸 Upload
        </Link>
      </nav>

      {/* Galerie principale */}
      <div className="px-4">
        <Gallery />
      </div>
    </div>
  );
}
