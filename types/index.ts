// Types partagés pour l'application
export type MediaFile = {
  id: string;
  name: string;
  thumbnailLink: string;
  webViewLink: string;
  url?: string;
  size?: number;
  type?: string;
};

export type TabType = "photos" | "videos";

export type ModalContent = {
  type: "photo" | "video";
  url: string;
  name: string;
} | null;

export type UploadProgressState = {
  progress: number;
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
  isUploading: boolean;
};

export type FileValidationResult = {
  validFiles: File[];
  errors: string[];
};

// Interface pour gérer l'état de la modal dans l'historique
export interface WindowWithModalHandler extends Window {
  modalBackHandler?: (e: PopStateEvent) => void;
}

// Types pour la pagination et infinite scroll
export interface PaginationInfo {
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
  count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
