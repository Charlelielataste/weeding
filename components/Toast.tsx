// Composant Toast pour les notifications non-intrusives
"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto-fermeture après 4 secondes

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const toastStyles = {
    success: {
      bg: "bg-gradient-to-r from-green-500 to-emerald-500",
      icon: "✅",
      border: "border-green-200",
    },
    error: {
      bg: "bg-gradient-to-r from-red-500 to-rose-500",
      icon: "❌",
      border: "border-red-200",
    },
    info: {
      bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
      icon: "ℹ️",
      border: "border-blue-200",
    },
  };

  const style = toastStyles[type];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top-2 duration-300">
      <div
        className={`${style.bg} text-white px-6 py-4 shadow-lg border-b-2 ${style.border} w-full backdrop-blur-sm`}
      >
        <div className="flex items-center justify-center space-x-3 max-w-4xl mx-auto">
          <span className="text-xl">{style.icon}</span>
          <p className="font-medium text-sm flex-1 text-center">{message}</p>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold ml-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
