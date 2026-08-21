"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DeleteJuryVoteButtonProps = {
  challengeId: number;
  userId: string;
  userName: string;
};

export default function DeleteJuryVoteButton({
  challengeId,
  userId,
  userName,
}: DeleteJuryVoteButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;

    const confirmed = window.confirm(
      `Biztosan törölni szeretnéd ${userName} szavazatát?\n\nCsak ennek a zsűritagnak ezen a szavazáson leadott szavazata törlődik.\n\nA felhasználói fiók és más szavazásokon leadott szavazatai megmaradnak.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const { error } = await supabase.rpc("admin_delete_jury_vote", {
        p_challenge_id: challengeId,
        p_user_id: userId,
      });

      if (error) {
        throw error;
      }

      router.refresh();
    } catch (error) {
      console.error("Hiba a zsűritag szavazatának törlésekor:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Hiba történt a szavazat törlése során."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:border-red-400/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? "Törlés..." : "🗑️ Szavazat törlése"}
    </button>
  );
}
