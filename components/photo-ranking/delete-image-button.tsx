"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DeleteImageButtonProps = {
  imageId: number;
  imagePath: string;
  disabled?: boolean;
};

export default function DeleteImageButton({
  imageId,
  imagePath,
  disabled = false,
}: DeleteImageButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (disabled) return;

    const confirmed = window.confirm(
      "Biztosan törölni szeretnéd ezt a képet?"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const { error: storageError } = await supabase.storage
        .from("challenge-images")
        .remove([imagePath]);

      if (storageError) {
        throw storageError;
      }

      const { error: databaseError } = await supabase
        .from("images")
        .delete()
        .eq("id", imageId);

      if (databaseError) {
        throw databaseError;
      }

      router.refresh();
    } catch (error) {
      console.error("Hiba a kép törlésekor:", error);
      alert("Hiba történt a kép törlése során.");
    } finally {
      setDeleting(false);
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="w-full border-t px-3 py-2 text-sm hover:bg-red-950/30 disabled:opacity-50"
    >
      {deleting ? "Törlés..." : "Kép törlése"}
    </button>
  );
}
