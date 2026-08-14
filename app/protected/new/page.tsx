import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

async function createChallenge(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();

  if (!name) {
    return;
  }

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

  const { error } = await supabase
    .from("challenges")
    .insert({ name });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected");
  redirect("/protected");
}

export default async function NewChallengePage() {
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

  return (
    <main className="w-full max-w-2xl mx-auto py-12 px-6">
      <p className="text-sm text-muted-foreground">ADMIN FELÜLET</p>

      <h1 className="text-4xl font-bold mt-2">
        Új szavazás
      </h1>

      <p className="mt-3 text-muted-foreground">
        Adj nevet az új képes kihívásnak.
      </p>

      <form action={createChallenge} className="mt-10">
        <label
          htmlFor="name"
          className="block font-medium mb-2"
        >
          Szavazás neve
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="pl. 2026. augusztusi kihívás"
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none"
        />

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="rounded-lg bg-foreground text-background px-5 py-3 font-medium"
          >
            Létrehozás
          </button>

          <Link
            href="/protected"
            className="rounded-lg border px-5 py-3 font-medium"
          >
            Mégse
          </Link>
        </div>
      </form>
    </main>
  );
}
