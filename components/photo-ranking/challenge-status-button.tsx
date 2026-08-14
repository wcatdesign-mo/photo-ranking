"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ChallengeStatusButtonProps = {
  challengeId: number;
  active: boolean;
};

export default function ChallengeStatusButton({
  challengeId,
  active,
}: ChallengeStatusButtonProps) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleToggle() {
    setSaving(true);

    const { error } = await supabase
      .from("challenges")
      .update({ active: !active })
      .eq("id", challengeId);

    if (error) {
      console.error("Hiba a szavazás állapotának módosításakor:", error);
      alert("Nem sikerült módosítani a szavazás állapotát.");
      setSaving(false);
      return;
    }

    router.refresh();
    setSaving(false);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      className="rounded-lg border px-4 py-2 font-medium transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      {saving
        ? "Mentés..."
        : active
          ? "Szavazás lezárása"
          : "Szavazás újranyitása"}
    </button>
  );
}
