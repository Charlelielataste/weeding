// Page galerie dédiée
"use client";

import Link from "next/link";
import { Gallery } from "../../components/Gallery";
import ArrowLeftIcon from "@/components/icons/ArrowLeftIcon";

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      {/* Navigation */}
      <nav className="fixed top-4 left-4 z-50 ">
        <Link
          href="/"
          className="bg-white/90 text-purple-600 font-bold rounded-xl px-4 py-2 shadow-lg flex items-center gap-1"
        >
          <ArrowLeftIcon className="size-4" /> Accueil
        </Link>
      </nav>

      <nav className="fixed top-4 right-4 z-50">
        <Link
          href="/upload"
          className="bg-white/90 text-pink-600 font-bold rounded-xl px-4 py-2 shadow-lg flex items-center gap-2"
        >
          <span>📲</span> Ajouter
        </Link>
      </nav>

      {/* Galerie principale */}
      <div className="px-4">
        <Gallery />
      </div>
    </div>
  );
}
