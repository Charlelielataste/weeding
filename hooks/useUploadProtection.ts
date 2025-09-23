// Hook pour protéger contre la perte d'uploads en cours
import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface UseUploadProtectionOptions {
  isUploading: boolean;
  message?: string;
}

export function useUploadProtection({
  isUploading,
  message = "⚠️ Un upload est en cours ! Vous allez perdre votre progression si vous quittez maintenant. Êtes-vous sûr de vouloir continuer ?",
}: UseUploadProtectionOptions) {
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

  // Protection spécifique pour Android - bouton retour physique/gesture
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      if (isUploading) {
        e.preventDefault();
        const shouldLeave = window.confirm(message);
        if (!shouldLeave) {
          console.log("🚫 Bouton retour Android bloqué - upload en cours");
          return false;
        }
      }
    };

    // Protection pour les navigateurs Android avec gesture de retour
    const handleTouchStart = (e: TouchEvent) => {
      if (isUploading && e.touches.length > 0) {
        const touch = e.touches[0];
        // Détecter un swipe depuis le bord gauche (gesture de retour)
        if (touch.clientX < 50) {
          e.preventDefault();
          const shouldLeave = window.confirm(message);
          if (!shouldLeave) {
            console.log("🚫 Gesture retour Android bloqué - upload en cours");
          }
        }
      }
    };

    // Protection pour les WebViews Android
    if (isUploading && typeof window !== "undefined") {
      // Écouter l'événement backbutton pour les WebViews
      document.addEventListener("backbutton", handleBackButton, false);
      document.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      console.log("🛡️ Protection bouton retour Android activée");
    }

    return () => {
      document.removeEventListener("backbutton", handleBackButton, false);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [isUploading, message]);

  // Protection supplémentaire pour la barre de navigation Android
  useEffect(() => {
    if (!isUploading || typeof window === "undefined") return;

    // Détecter les changements de visibilité de la page (Android peut minimiser l'app)
    const handleVisibilityChange = () => {
      if (document.hidden && isUploading) {
        console.log(
          "⚠️ Page cachée pendant upload - Android peut avoir minimisé l'app"
        );
        // Optionnel: afficher une notification ou alerte
      }
    };

    // Protection contre les événements de focus/blur (navigation Android)
    const handleFocus = () => {
      if (isUploading) {
        console.log("🔄 Retour focus - vérification upload en cours");
      }
    };

    const handleBlur = () => {
      if (isUploading) {
        console.log("⚠️ Perte de focus - upload en cours");
      }
    };

    // Protection contre les changements d'orientation (peut déclencher des rechargements)
    const handleOrientationChange = () => {
      if (isUploading) {
        console.log("📱 Changement d'orientation pendant upload");
        // Empêcher le rechargement automatique
        window.history.pushState(null, "", pathname);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("orientationchange", handleOrientationChange);

    console.log("🛡️ Protection barre navigation Android activée");

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [isUploading, pathname]);

  // Fonction pour débloquer manuellement (en cas d'upload terminé)
  const clearProtection = useCallback(() => {
    console.log("🔓 Protection upload manuellement désactivée");
  }, []);

  return {
    isProtected: isUploading,
    clearProtection,
  };
}
