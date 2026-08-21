"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DeleteChallengeButtonProps = {
  challengeId: number;
  challengeName: string;
};

export default function DeleteChallengeButton({
  challengeId,
  challengeName,
}: DeleteChallengeButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;

    const confirmed = window.confirm(
      `Biztosan törölni szeretnéd a(z) "${challengeName}" szavazást?\n\nA hozzá tartozó képek, leadott szavazatok és eredmények is törlődnek.\n\nEz a művelet nem vonható vissza.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      // Először lekérjük a challenge-hez tartozó képek Storage útvonalait.
      const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("image_url")
        .eq("challenge_id", challengeId);

      if (imagesError) {
        throw imagesError;
      }

      const imagePaths = (images ?? [])
        .map((image) => image.image_url)
        .filter(Boolean);

      // A Storage fájlokat külön kell törölni,
      // mert az adatbázis CASCADE nem törli őket.
      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("challenge-images")
          .remove(imagePaths);

        if (storageError) {
          throw storageError;
        }
      }

      // A CASCADE automatikusan törli a kapcsolódó:
      // images, rankings és vote_submissions rekordokat.
      const { error: challengeError } = await supabase
        .from("challenges")
        .delete()
        .eq("id", challengeId);

      if (challengeError) {
        throw challengeError;
      }

      router.refresh();
    } catch (error) {
      console.error("Hiba a szavazás törlésekor:", error);
      alert("Hiba történt a szavazás törlése során.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-medium text-red-300 transition hover:border-red-400/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? "Törlés..." : "🗑️ Törlés"}
    </button>
  );
}
