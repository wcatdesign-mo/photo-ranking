import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteChallengeButton from "@/components/photo-ranking/delete-challenge-button";

export const instant = false;

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">Photo Ranking</h1>
          <p className="mt-4 text-muted-foreground">
            Ehhez a fiókhoz még nincs profil beállítva.
          </p>
        </div>
      </main>
    );
  }

  if (profile.role !== "admin") {
    const { data: challenges, error: challengesError } =
      await supabase
        .from("challenges")
        .select("id, name, active, created_at")
        .order("created_at", { ascending: false });

    if (challengesError) {
      throw new Error(challengesError.message);
    }

    return (
      <main className="min-h-screen px-6 py-10">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl">
          <header>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-purple-300">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              ZSŰRI FELÜLET
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
              Photo Ranking
            </h1>

            <p className="mt-3 text-muted-foreground">
              Üdv, {profile.name || user.email}!
            </p>
          </header>

          <section className="mt-12">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">
                Szavazások
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Válaszd ki a zsűrizni kívánt versenyt.
              </p>
            </div>

            {challenges?.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white/[0.02] p-10 text-center">
                <div className="text-4xl">📋</div>

                <h3 className="mt-4 text-lg font-semibold">
                  Jelenleg nincs elérhető szavazás
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Ha új szavazás elérhetővé válik, itt fog megjelenni.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {challenges?.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm backdrop-blur transition hover:border-purple-500/30 hover:bg-white/[0.05] md:p-6"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold">
                            {challenge.name}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${
                              challenge.active
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : "border-white/10 bg-white/5 text-muted-foreground"
                            }`}
                          >
                            {challenge.active ? "Aktív" : "Lezárt"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">
                          Szavazás #{challenge.id}
                        </p>
                      </div>

                      <Link
                        href={`/rank/${challenge.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 font-medium text-purple-200 transition hover:border-purple-400/50 hover:bg-purple-500/20"
                      >
                        {challenge.active
                          ? "Szavazás megnyitása"
                          : "Megtekintés"}
                        <span className="ml-2 transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  const { data: challenges, error: challengesError } =
    await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

  if (challengesError) {
    throw new Error(challengesError.message);
  }

  const { count: imageCount } = await supabase
    .from("images")
    .select("*", { count: "exact", head: true });

  const { count: rankingCount } = await supabase
    .from("rankings")
    .select("*", { count: "exact", head: true });

  const challengeCount = challenges?.length ?? 0;

  return (
    <main className="min-h-screen px-6 py-10">
      {/* Háttér glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-purple-300">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              ADMIN FELÜLET
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
              Photo Ranking
            </h1>

            <p className="mt-3 text-muted-foreground">
              Üdv, {profile.name || user.email}!
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/protected/users"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-medium transition hover:border-purple-500/30 hover:bg-white/[0.06]"
            >
              👥 Felhasználók
            </Link>

            <Link
              href="/protected/new"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-purple-500/10 transition hover:from-purple-500 hover:to-blue-500"
            >
              + Új szavazás
            </Link>
          </div>
        </header>

        {/* Stats */}
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-6">
            <p className="text-sm font-medium text-purple-300">
              Szavazások
            </p>

            <p className="mt-3 text-4xl font-bold">
              {challengeCount}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              létrehozott verseny
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-6">
            <p className="text-sm font-medium text-blue-300">
              Feltöltött képek
            </p>

            <p className="mt-3 text-4xl font-bold">
              {imageCount ?? 0}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              összes nevezett kép
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
            <p className="text-sm font-medium text-emerald-300">
              Beküldött rangsorok
            </p>

            <p className="mt-3 text-4xl font-bold">
              {rankingCount ?? 0}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              leadott zsűriértékelés
            </p>
          </div>
        </section>

        {/* Challenges */}
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">
              Szavazások
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Kezeld a létrehozott fotóversenyeket és azok eredményeit.
            </p>
          </div>

          {challengeCount === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white/[0.02] p-12 text-center">
              <div className="text-4xl">📷</div>

              <h3 className="mt-4 text-lg font-semibold">
                Még nincs létrehozott szavazás
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Hozd létre az első képes kihívást a kezdéshez.
              </p>

              <Link
                href="/protected/new"
                className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 font-semibold text-white"
              >
                + Első szavazás létrehozása
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {challenges?.map((challenge) => (
                <div
                  key={challenge.id}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm backdrop-blur transition hover:border-purple-500/30 hover:bg-white/[0.05] md:p-6"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold">
                          {challenge.name}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            challenge.active
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-white/10 bg-white/5 text-muted-foreground"
                          }`}
                        >
                          {challenge.active ? "Aktív" : "Lezárt"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Szavazás #{challenge.id}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/rank/${challenge.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 font-medium text-purple-200 transition hover:border-purple-400/50 hover:bg-purple-500/20"
                      >
                        🗳️ Szavazás
                        <span className="ml-2 transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </Link>

                      <Link
                        href={`/protected/challenges/${challenge.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 font-medium transition hover:border-purple-500/30 hover:bg-white/[0.06]"
                      >
                        Kezelés
                        <span className="ml-2 transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </Link>

                      <DeleteChallengeButton
                        challengeId={challenge.id}
                        challengeName={challenge.name}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
