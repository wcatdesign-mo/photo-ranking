"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE = 1600;
const WEBP_QUALITY = 0.82;

async function optimizeImage(file: File): Promise<Blob> {
  const image = new Image();

  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error(`${file.name} nem olvasható képfájl.`));
      image.src = objectUrl;
    });

    const scale = Math.min(
      1,
      MAX_IMAGE_SIZE / Math.max(image.naturalWidth, image.naturalHeight)
    );

    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("A kép optimalizálása nem sikerült.");
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
    });

    if (!blob) {
      throw new Error("A WebP kép létrehozása nem sikerült.");
    }

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ImageUploader({
  challengeId,
}: {
  challengeId: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage("");

    let uploaded = 0;
    const total = files.length;

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} nem képfájl.`);
        }

        setMessage(
          `${uploaded + 1} / ${total} kép feldolgozása...`
        );

        const optimizedImage = await optimizeImage(file);

        const storagePath =
          `${challengeId}/${crypto.randomUUID()}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("challenge-images")
          .upload(storagePath, optimizedImage, {
            cacheControl: "3600",
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { error: databaseError } = await supabase
          .from("images")
          .insert({
            challenge_id: challengeId,
            image_url: storagePath,
          });

        if (databaseError) {
          await supabase.storage
            .from("challenge-images")
            .remove([storagePath]);

          throw databaseError;
        }

        uploaded++;
      }

      setMessage(
        `${uploaded} kép sikeresen feltöltve és optimalizálva.`
      );

      router.refresh();
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : "Hiba történt a feltöltés során.";

      setMessage(`Hiba: ${text}`);
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg bg-foreground text-background px-5 py-3 font-medium disabled:opacity-50"
      >
        {uploading ? "Képek feldolgozása..." : "+ Képek feltöltése"}
      </button>

      {message && (
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
