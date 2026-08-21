"use client";

import { useEffect } from "react";

type ImageLightboxProps = {
  imageUrl: string;
  alt: string;
  onClose: () => void;
};

export default function ImageLightbox({
  imageUrl,
  alt,
  onClose,
}: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Kép nagyított nézete"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Bezárás"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-2xl text-white transition hover:bg-white/10"
      >
        ×
      </button>

      <img
        src={imageUrl}
        alt={alt}
        draggable={false}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
      />
    </div>
  );
}
