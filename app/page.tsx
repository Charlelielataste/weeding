import Title from "@/components/Title";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        {/* Header principal */}
        <div className="mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <span className="text-4xl">💕</span>
            <Title />
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
            className="block bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 px-8 rounded-2xl font-semibold text-lg hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">📸</span>
              <span>Ajouter Photos & Vidéos</span>
              <span className="text-2xl">🎬</span>
            </div>
          </Link>

          <Link
            href="/gallery"
            className="block bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 px-8 rounded-2xl font-semibold text-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">🎭</span>
              <span>Voir la Galerie</span>
              <span className="text-2xl">🖼️</span>
            </div>
          </Link>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-12 p-6 bg-white/60 backdrop-blur rounded-2xl border border-pink-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            💌 Comment ça marche ?
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              📱 <strong>Upload :</strong> Ajoutez vos photos et vidéos du
              mariage
            </p>
            <p>
              🎨 <strong>Galerie :</strong> Découvrez tous les souvenirs
              partagés
            </p>
            <p>
              💝 <strong>:</strong> N&apos;hésitez pas à leur laisser un message
              vidéo
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-400">
          <p>Merci de partager ces moments magiques avec nous ! 🥂</p>
        </div>
      </div>
    </div>
  );
}
