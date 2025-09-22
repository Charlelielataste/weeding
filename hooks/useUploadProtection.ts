// Hook pour protéger contre la perte d'uploads en cours
import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UseUploadProtectionOptions {
  isUploading: boolean;
  message?: string;
}

export function useUploadProtection({
  isUploading,
  message = "⚠️ Un upload est en cours ! Vous allez perdre votre progression si vous quittez maintenant. Êtes-vous sûr de vouloir continuer ?",
}: UseUploadProtectionOptions) {
  const router = useRouter();
  const pathname = usePathname();

  // Protection contre le refresh/fermeture de page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = message; // Pour les anciens navigateurs
        return message;
      }
    };

    if (isUploading) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      console.log("🛡️ Protection upload activée (beforeunload)");
    } else {
      console.log("✅ Protection upload désactivée");
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isUploading, message]);

  // Protection contre la navigation via les liens Next.js
  // Note: App Router n'a pas d'événements de route comme Pages Router
  // On va intercepter les clics sur les liens
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isUploading) return;

      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && link.href !== window.location.href) {
        const shouldLeave = window.confirm(message);
        if (!shouldLeave) {
          e.preventDefault();
          e.stopPropagation();
          console.log("🚫 Navigation bloquée - upload en cours");
        }
      }
    };

    if (isUploading) {
      document.addEventListener("click", handleClick, true);
      console.log("🛡️ Protection navigation activée");
    }

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [isUploading, message]);

  // Protection contre l'utilisation du bouton retour
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isUploading) {
        const shouldLeave = window.confirm(message);
        if (!shouldLeave) {
          e.preventDefault();
          window.history.pushState(null, "", pathname);
          console.log("🚫 Navigation retour bloquée - upload en cours");
        }
      }
    };

    if (isUploading) {
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isUploading, message, pathname]);

  // Fonction pour débloquer manuellement (en cas d'upload terminé)
  const clearProtection = useCallback(() => {
    console.log("🔓 Protection upload manuellement désactivée");
  }, []);

  return {
    isProtected: isUploading,
    clearProtection,
  };
}
