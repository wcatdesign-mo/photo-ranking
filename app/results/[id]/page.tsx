import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challengeId = Number(id);

  if (!Number.isInteger(challengeId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: challenge, error: challengeError } =
    await supabase.rpc("get_public_challenge", {
      p_challenge_id: challengeId,
    });

  if (challengeError) {
    console.error(
      "Hiba a verseny lekérésekor:",
      challengeError
    );
    notFound();
  }

  const challengeData = challenge?.[0];

  if (!challengeData) {
    notFound();
  }

  if (challengeData.active) {
    return (
      <main className="min-h-screen w-full max-w-5xl mx-auto px-6 py-16">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-xl rounded-3xl border p-12 text-center shadow-sm">
            <div className="text-5xl">🔒</div>

            <h1 className="mt-6 text-3xl font-bold">
              Az eredmények még nem érhetők el
            </h1>

            <p className="mt-3 text-muted-foreground">
              A szavazás még folyamatban van.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: results, error: resultsError } =
    await supabase.rpc("get_public_results", {
      p_challenge_id: challengeId,
    });

  if (resultsError) {
    console.error(
      "Hiba a publikus eredmények lekérésekor:",
      resultsError
    );
  }

  type PublicResult = {
    image_id: number;
    image_url: string;
    votes: number;
    points: number;
  };

  const publicResults: PublicResult[] =
    (results ?? []) as PublicResult[];

  const imagePaths = publicResults.map(
    (result: PublicResult) => result.image_url
  );

  let resultsWithUrls = publicResults.map(
    (result: PublicResult) => ({
      ...result,
      signedUrl: null as string | null,
    })
  );

  if (imagePaths.length > 0) {
    const { data: signedUrls, error: signedUrlsError } =
      await supabase.storage
        .from("challenge-images")
        .createSignedUrls(imagePaths, 60 * 60);

    if (signedUrlsError) {
      console.error(
        "Hiba a publikus eredményképek signed URL-jeinek létrehozásakor:",
        signedUrlsError
      );
    } else if (signedUrls) {
      resultsWithUrls = publicResults.map(
        (result: PublicResult, index: number) => ({
          ...result,
          signedUrl: signedUrls[index]?.signedUrl ?? null,
        })
      );
    }
  }

  const firstPlace = resultsWithUrls[0];
  const secondPlace = resultsWithUrls[1];
  const thirdPlace = resultsWithUrls[2];

  return (
    <main className="min-h-screen w-full max-w-6xl mx-auto px-6 py-14">
      {/* Fejléc */}
      <header className="text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground">
          PHOTO RANKING
        </p>

        <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
          A verseny végeredménye
        </h1>

        <p className="mt-3 text-lg text-muted-foreground">
          {challengeData.name}
        </p>
      </header>

      {resultsWithUrls.length === 0 ? (
        <div className="mt-14 rounded-3xl border p-12 text-center text-muted-foreground">
          Még nincs értékelhető eredmény.
        </div>
      ) : (
        <section className="mt-14">
          {/* 1. hely */}
          {firstPlace && (
            <div className="mx-auto max-w-xl">
              <div className="rounded-3xl border p-6 md:p-8 text-center shadow-sm">
                <div className="text-5xl">🥇</div>

                <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  1. hely
                </p>

                {firstPlace.signedUrl ? (
                  <img
                    src={firstPlace.signedUrl}
                    alt="1. helyezett"
                    className="mt-6 w-full max-w-[360px] mx-auto aspect-square rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mt-6 aspect-square rounded-2xl border flex items-center justify-center text-muted-foreground">
                    Nincs kép
                  </div>
                )}

                <div className="mt-6">
                  <p className="text-5xl font-bold">
                    {firstPlace.points}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    pont
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. és 3. hely */}
          {(secondPlace || thirdPlace) && (
            <div className="mt-8 grid gap-5 md:grid-cols-2 max-w-2xl mx-auto">
              {secondPlace && (
                <div className="rounded-3xl border p-4 text-center shadow-sm">
                  <div className="text-4xl">🥈</div>

                  <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    2. hely
                  </p>

                  {secondPlace.signedUrl ? (
                    <img
                      src={secondPlace.signedUrl}
                      alt="2. helyezett"
                      className="mt-5 w-full max-w-[220px] mx-auto aspect-square rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="mt-5 aspect-square rounded-2xl border flex items-center justify-center text-muted-foreground">
                      Nincs kép
                    </div>
                  )}

                  <div className="mt-5">
                    <p className="text-4xl font-bold">
                      {secondPlace.points}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      pont
                    </p>
                  </div>
                </div>
              )}

              {thirdPlace && (
                <div className="rounded-3xl border p-4 text-center shadow-sm">
                  <div className="text-4xl">🥉</div>

                  <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    3. hely
                  </p>

                  {thirdPlace.signedUrl ? (
                    <img
                      src={thirdPlace.signedUrl}
                      alt="3. helyezett"
                      className="mt-5 w-full max-w-[220px] mx-auto aspect-square rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="mt-5 aspect-square rounded-2xl border flex items-center justify-center text-muted-foreground">
                      Nincs kép
                    </div>
                  )}

                  <div className="mt-5">
                    <p className="text-4xl font-bold">
                      {thirdPlace.points}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      pont
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
