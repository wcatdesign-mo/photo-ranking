import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ImageUploader from "@/components/photo-ranking/image-uploader";
import DeleteImageButton from "@/components/photo-ranking/delete-image-button";
import ChallengeStatusButton from "@/components/photo-ranking/challenge-status-button";
import DeleteJuryVoteButton from "@/components/photo-ranking/delete-jury-vote-button";

export const instant = false;

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (!challenge) {
    notFound();
  }

  const { data: images } = await supabase
    .from("images")
    .select("*")
    .eq("challenge_id", id)
    .order("created_at", { ascending: true });

  const imagesWithUrls = await Promise.all(
    (images ?? []).map(async (image) => {
      const { data } = await supabase.storage
        .from("challenge-images")
        .createSignedUrl(image.image_url, 60 * 60);

      return {
        ...image,
        signedUrl: data?.signedUrl ?? null,
      };
    })
  );

  const { data: rankings } = await supabase
    .from("rankings")
    .select("image_id, position, user_id")
    .eq("challenge_id", id);

  type JuryRanking = {
    image_id: number;
    user_id: string;
    user_name: string | null;
    user_avatar: string | null;
    ranking_position: number;
  };

  const { data: juryRankingsData, error: juryRankingsError } =
    await supabase.rpc("get_public_jury_rankings", {
      p_challenge_id: Number(id),
    });

  if (juryRankingsError) {
    console.error(
      "Hiba a zsűritagok egyéni rangsorának lekérésekor:",
      juryRankingsError
    );
  }

  const juryRankings = (juryRankingsData ?? []) as JuryRanking[];

  const juryRankingsByImage = new Map<number, JuryRanking[]>();

  for (const ranking of juryRankings) {
    const existing = juryRankingsByImage.get(ranking.image_id) ?? [];
    existing.push(ranking);
    juryRankingsByImage.set(ranking.image_id, existing);
  }

  const voteCount = new Set(
    (rankings ?? []).map((ranking) => ranking.user_id)
  ).size;

  const { data: voteStatus, error: voteStatusError } =
    await supabase.rpc("admin_get_vote_status", {
      p_challenge_id: Number(id),
    });

  if (voteStatusError) {
    console.error(
      "Hiba a zsűri állapotának lekérésekor:",
      voteStatusError
    );
  }

  const { data: juryStatus, error: juryStatusError } =
    await supabase.rpc("admin_get_challenge_jury_status", {
      p_challenge_id: Number(id),
    });

  if (juryStatusError) {
    console.error(
      "Hiba a zsűritagok állapotának lekérésekor:",
      juryStatusError
    );
  }

  const juryCount = Number(voteStatus?.[0]?.jury_count ?? 0);
  const submittedCount = Number(
    voteStatus?.[0]?.submitted_count ?? 0
  );

  const voteProgress =
    juryCount > 0
      ? Math.min(
          100,
          Math.round((submittedCount / juryCount) * 100)
        )
      : 0;

  const results = (imagesWithUrls ?? [])
    .map((image) => {
      const imageRankings = (rankings ?? []).filter(
        (ranking) => ranking.image_id === image.id
      );

      const points = imageRankings.reduce(
        (total, ranking) =>
          total + ((imagesWithUrls.length - ranking.position) + 1),
        0
      );

      const positionCounts = imageRankings.reduce(
        (counts, ranking) => {
          counts[ranking.position] =
            (counts[ranking.position] ?? 0) + 1;

          return counts;
        },
        {} as Record<number, number>
      );

      return {
        ...image,
        points,
        votes: imageRankings.length,
        positionCounts,
        juryRankings: juryRankingsByImage.get(image.id) ?? [],
      };
    })
    .sort((a, b) => b.points - a.points);

  return (
    <main className="min-h-screen px-6 py-10">
      {/* Háttér glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Vissza */}
        <Link
          href="/protected"
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground transition hover:border-purple-500/30 hover:bg-white/[0.06] hover:text-foreground"
        >
          ← Dashboard
        </Link>

        {/* Fejléc */}
        <header className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            SZAVAZÁS KEZELÉSE
          </div>

          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                {challenge.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    challenge.active
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 text-muted-foreground"
                  }`}
                >
                  {challenge.active ? "● Aktív" : "Lezárt"}
                </span>

                <ChallengeStatusButton
                  challengeId={Number(id)}
                  active={challenge.active}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Képek */}
        <section className="mt-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                Nevezett képek
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {images?.length ?? 0} feltöltött kép
              </p>
            </div>

            <ImageUploader challengeId={Number(id)} />
          </div>

          {(images?.length ?? 0) === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <div className="text-4xl">📷</div>

              <h3 className="mt-4 text-lg font-semibold">
                Még nincs feltöltött kép
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Töltsd fel a zsűrizéshez szükséges képeket.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {imagesWithUrls.map((image, index) => (
                <div
                  key={image.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-sm backdrop-blur transition hover:border-purple-500/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <span className="text-sm font-semibold">
                      #{index + 1}
                    </span>

                    {voteCount === 0 && (
                      <span className="text-xs text-muted-foreground">
                        Törölhető
                      </span>
                    )}
                  </div>

                  {image.signedUrl ? (
                    <img
                      src={image.signedUrl}
                      alt={`Kép ${index + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                      A kép nem tölthető be
                    </div>
                  )}

                  <DeleteImageButton
                    imageId={image.id}
                    imagePath={image.image_url}
                    disabled={voteCount > 0}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Eredmények */}
        <section className="mt-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-blue-300">
              EREDMÉNYEK
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              🏆 Zsűri eredménye
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {voteCount} leadott szavazat alapján
            </p>
          </div>

          {/* Zsűri státusz */}
          <div className="mt-6 max-w-2xl rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {submittedCount === juryCount && juryCount > 0
                    ? "✅ Minden zsűritag szavazott"
                    : "🟢 Zsűri állapota"}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {submittedCount} / {juryCount} zsűritag leadta a szavazatát
                </p>
              </div>

              <span className="text-xl font-bold">
                {voteProgress}%
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                style={{ width: `${voteProgress}%` }}
              />
            </div>
          </div>

          {/* Zsűritagok szavazási állapota */}
          <section className="mt-8 max-w-4xl">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm backdrop-blur">
              <div>
                <h3 className="text-lg font-semibold">
                  🧑‍⚖️ Zsűritagok
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ezen a szavazáson leadott szavazatok kezelése.
                </p>
              </div>

              <div className="mt-5 divide-y divide-white/10">
                {(juryStatus ?? []).length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    Nincs regisztrált zsűritag.
                  </p>
                ) : (
                  (juryStatus ?? []).map(
                    (jury: {
                      user_id: string;
                      name: string | null;
                      email: string | null;
                      has_voted: boolean;
                    }) => (
                      <div
                        key={jury.user_id}
                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {jury.name || "Névtelen felhasználó"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {jury.email || "Nincs e-mail cím"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {jury.has_voted ? (
                            <>
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                                ✅ Leadta a szavazatát
                              </span>

                              <DeleteJuryVoteButton
                                challengeId={Number(id)}
                                userId={jury.user_id}
                                userName={
                                  jury.name ||
                                  jury.email ||
                                  "ezt a zsűritagot"
                                }
                              />
                            </>
                          ) : (
                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-muted-foreground">
                              ⏳ Még nem szavazott
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </section>

          {/* Eredménylista */}
          {voteCount === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-muted-foreground">
              <div className="text-3xl">📊</div>

              <p className="mt-3">
                Még nincs leadott szavazat.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {results.map((image, index) => (
                <div
                  key={image.id}
                  className={`rounded-2xl border p-4 shadow-sm backdrop-blur transition ${
                    index === 0
                      ? "border-yellow-500/30 bg-yellow-500/[0.05]"
                      : index === 1
                        ? "border-slate-400/20 bg-white/[0.04]"
                        : index === 2
                          ? "border-orange-500/20 bg-orange-500/[0.04]"
                          : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex w-14 shrink-0 justify-center">
                      <div className="text-3xl font-bold">
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : `${index + 1}.`}
                      </div>
                    </div>

                    {image.signedUrl ? (
                      <img
                        src={image.signedUrl}
                        alt={`Kép ${image.id}`}
                        className="h-24 w-24 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-white/10 text-xs text-muted-foreground">
                        Nincs kép
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        Kép #
                        {(images ?? []).findIndex(
                          (item) => item.id === image.id
                        ) + 1}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {image.votes} szavazatot kapott
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(image.positionCounts)
                          .sort(
                            ([a], [b]) =>
                              Number(a) - Number(b)
                          )
                          .map(([position, count]) => (
                            <span
                              key={position}
                              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium"
                            >
                              {Number(position) === 1
                                ? "🥇"
                                : Number(position) === 2
                                  ? "🥈"
                                  : Number(position) === 3
                                    ? "🥉"
                                    : `${position}.`}{" "}
                               hely: {Number(count)} fő
                            </span>
                          ))}
                      </div>
                    </div>

                    {image.juryRankings.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Zsűritagok rangsora
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {image.juryRankings
                            .sort(
                              (a: JuryRanking, b: JuryRanking) =>
                                a.ranking_position - b.ranking_position
                            )
                            .map((jury: JuryRanking) => {
                              let avatarSrc: string | null = null;

                              if (jury.user_avatar) {
                                if (jury.user_avatar.startsWith("/")) {
                                  avatarSrc = jury.user_avatar;
                                } else if (
                                  jury.user_avatar.endsWith(".png")
                                ) {
                                  avatarSrc = `/avatars/${jury.user_avatar}`;
                                } else {
                                  avatarSrc = `/avatars/${jury.user_avatar}.png`;
                                }
                              }

                              return (
                                <div
                                  key={`${image.id}-${jury.user_id}`}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1"
                                >
                                  {avatarSrc ? (
                                    <img
                                      src={avatarSrc}
                                      alt=""
                                      className="h-7 w-7 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs">
                                      👤
                                    </div>
                                  )}

                                  <span className="max-w-[140px] truncate text-xs font-medium">
                                    {jury.user_name || "Névtelen"}
                                  </span>

                                  <span className="text-xs font-bold text-purple-300">
                                    #{jury.ranking_position}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <div className="shrink-0 sm:text-right">
                      <p className="text-3xl font-bold">
                        {image.points}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        pont
                      </p>
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
