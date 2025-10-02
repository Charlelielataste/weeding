// Page dédiée à l'upload
"use client";

import Link from "next/link";
import { PhotoUpload } from "../../components/PhotoUpload";
import { VideoUpload } from "../../components/VideoUpload";
import ArrowLeftIcon from "@/components/icons/ArrowLeftIcon";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      {/* Navigation */}
      <nav className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="bg-white/90 text-purple-600 font-bold rounded-xl px-4 py-2 shadow-lg flex items-center gap-1"
        >
          <ArrowLeftIcon className="size-4" /> Accueil
        </Link>
      </nav>

      <nav className="fixed top-4 right-4 z-50">
        <Link
          href="/gallery"
          className="bg-white/90 text-pink-600 font-bold rounded-xl px-4 py-2 shadow-lg flex items-center gap-2"
        >
          <span>🌸</span> Galerie
        </Link>
      </nav>

      {/* Section Upload */}
      <div className="max-w-lg mx-auto mb-8 mt-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-100 p-6">
          <div className="max-w-lg mx-auto mb-8">
            <p className="font-semibold text-black/50 text-sm text-center">
              Si vous rencontrez des problèmes pour ajouter des photos ou des
              vidéos, vous pouvez les envoyez depuis ce lien Drive :
            </p>
            <div className="flex justify-center">
              <a
                href="https://drive.google.com/drive/folders/1URx5iz0ZIopQ-nMBVqfs247v5bfsXOCk"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-center text-pink-600 underline mt-3"
              >
                Dossier Photos & Vidéos Mariage
              </a>
            </div>
          </div>
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
