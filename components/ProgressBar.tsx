// Composant réutilisable pour les barres de progression
import { UploadProgressState } from "../types";

interface ProgressBarProps {
  uploadState: UploadProgressState;
  type: "photos" | "videos";
}

export function ProgressBar({ uploadState, type }: ProgressBarProps) {
  if (!uploadState.isUploading) return null;

  const colors = {
    photos: {
      bg: "from-pink-50 to-rose-50",
      border: "border-pink-200",
      gradient: "from-pink-500 to-rose-500",
      icon: "📸",
      text: "Upload photos en cours...",
    },
    videos: {
      bg: "from-purple-50 to-indigo-50",
      border: "border-purple-200",
      gradient: "from-purple-500 to-indigo-500",
      icon: "🎬",
      text: "Upload vidéos en cours...",
    },
  };

  const theme = colors[type];

  return (
    <div className="mt-4">
      <div
        className={`bg-gradient-to-r ${theme.bg} rounded-xl p-4 border-2 border-dashed ${theme.border}`}
      >
        <div className="text-center mb-3">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl animate-pulse">{theme.icon}</span>
            <p className="font-semibold text-gray-800">{theme.text}</p>
          </div>
          {uploadState.currentFileName && (
            <p className="text-sm text-gray-600 truncate max-w-xs mx-auto">
              {uploadState.currentFileIndex}/{uploadState.totalFiles}:{" "}
              {uploadState.currentFileName}
            </p>
          )}
        </div>

        {/* Barre de progression */}
        <div className="relative w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`bg-gradient-to-r ${theme.gradient} h-3 rounded-full transition-all duration-300 ease-in-out`}
            style={{ width: `${uploadState.progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {uploadState.currentFileIndex}/{uploadState.totalFiles} {type}
          </span>
          <span>{Math.round(uploadState.progress)}%</span>
        </div>
      </div>
    </div>
  );
}
