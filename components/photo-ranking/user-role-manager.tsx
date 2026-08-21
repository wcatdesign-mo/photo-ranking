"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  created_at: string;
};

export default function UserRoleManager({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [users, setUsers] = useState(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function changeRole(userId: string, role: string) {
    setSavingId(userId);

    try {
      const { error } = await supabase.rpc("admin_update_user_role", {
        p_user_id: userId,
        p_role: role,
      });

      if (error) {
        throw error;
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? { ...user, role }
            : user
        )
      );

      router.refresh();
    } catch (error) {
      console.error("Hiba a szerepkör módosításakor:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Hiba történt a szerepkör módosításakor."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteJuryMember(user: User) {
    if (user.role !== "jury") return;

    const confirmed = window.confirm(
      `Biztosan törölni szeretnéd a(z) "${user.name || user.email || "Névtelen felhasználó"}" zsűritagot?\n\nA hozzá tartozó leadott szavazatok is törlődnek.\n\nEz a művelet nem vonható vissza.`
    );

    if (!confirmed) return;

    setDeletingId(user.id);

    try {
      const { error } = await supabase.rpc("admin_delete_jury_member", {
        p_user_id: user.id,
      });

      if (error) {
        throw error;
      }

      setUsers((current) =>
        current.filter((currentUser) => currentUser.id !== user.id)
      );

      router.refresh();
    } catch (error) {
      console.error("Hiba a zsűritag törlésekor:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Hiba történt a zsűritag törlésekor."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8 overflow-hidden rounded-xl border">
      <div className="grid grid-cols-[1fr_180px_180px_180px] border-b px-5 py-4 text-sm font-semibold text-muted-foreground">
        <div>Felhasználó</div>
        <div>Regisztráció</div>
        <div>Szerepkör</div>
        <div>Művelet</div>
      </div>

      {users.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          Még nincs regisztrált felhasználó.
        </div>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-[1fr_180px_180px_180px] items-center border-b px-5 py-4 last:border-b-0"
          >
            <div>
              <p className="font-medium">
                {user.name || "Névtelen felhasználó"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {user.email || "Nincs e-mail cím"}
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString("hu-HU")}
            </div>

            <div>
              <select
                value={user.role}
                disabled={savingId === user.id}
                onChange={(event) =>
                  changeRole(user.id, event.target.value)
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="jury">Zsűritag</option>
                <option value="admin">Admin</option>
              </select>

              {savingId === user.id && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Mentés...
                </p>
              )}
            </div>

            <div>
              {user.role === "jury" && (
                <button
                  type="button"
                  onClick={() => deleteJuryMember(user)}
                  disabled={
                    deletingId === user.id || savingId === user.id
                  }
                  className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:border-red-400/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === user.id
                    ? "Törlés..."
                    : "🗑️ Törlés"}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
