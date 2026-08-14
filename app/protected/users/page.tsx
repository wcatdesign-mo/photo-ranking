import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UserRoleManager from "@/components/photo-ranking/user-role-manager";

export const instant = false;

export default async function UsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/protected");
  }

  const { data: users, error } = await supabase.rpc(
    "admin_get_users"
  );

  if (error) {
    console.error("Hiba a felhasználók lekérésekor:", error);
  }

  return (
    <main className="w-full max-w-6xl mx-auto py-10 px-6">
      <Link
        href="/protected"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Vissza a dashboardra
      </Link>

      <div className="mt-6">
        <p className="text-sm text-muted-foreground">
          ADMINISZTRÁCIÓ
        </p>

        <h1 className="mt-1 text-4xl font-bold">
          Felhasználók
        </h1>

        <p className="mt-3 text-muted-foreground">
          A regisztrált felhasználók szerepköreinek kezelése.
        </p>
      </div>

      <UserRoleManager initialUsers={users ?? []} />
    </main>
  );
}
