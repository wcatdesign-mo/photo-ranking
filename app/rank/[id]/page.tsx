import Link from "next/link";
import { notFound } from "next/navigation";
import RankingBoard from "@/components/photo-ranking/ranking-board";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function RankPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

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

  const imageList = images ?? [];

  let imagesWithUrls = imageList.map((image) => ({
    ...image,
    signedUrl: null as string | null,
  }));

  if (imageList.length > 0) {
    const paths = imageList.map((image) => image.image_url);

    const { data: signedUrls, error: signedUrlsError } =
      await supabase.storage
        .from("challenge-images")
        .createSignedUrls(paths, 60 * 60);

    if (signedUrlsError) {
      console.error(
        "Hiba a képek signed URL-jeinek létrehozásakor:",
        signedUrlsError
      );
    } else if (signedUrls) {
      imagesWithUrls = imageList.map((image, index) => ({
        ...image,
        signedUrl: signedUrls[index]?.signedUrl ?? null,
      }));
    }
  }

  return (
    <main className="w-full max-w-6xl mx-auto py-10 px-6">
      <Link
        href="/protected"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition"
      >
        ← Vissza a zsűri felületre
      </Link>

      <div className="mt-8">
        <p className="text-muted-foreground mb-2">
          KÉPEK RANGSOROLÁSA
        </p>

      <h1 className="text-4xl font-bold">
        {challenge.title}
      </h1>

      <p className="mt-4 text-muted-foreground">
        Állítsd sorrendbe a képeket a kedvencedtől a legkevésbé
        kedveltig.
      </p>

      {!challenge.active ? (
        <div className="mt-10 rounded-xl border p-8 text-center">
          <div className="text-4xl">🔒</div>

          <h2 className="mt-4 text-xl font-semibold">
            Ez a szavazás lezárult
          </h2>

          <p className="mt-2 text-muted-foreground">
            Erre a szavazásra már nem lehet új szavazatot leadni.
          </p>
        </div>
      ) : imagesWithUrls.length === 0 ? (
        <div className="mt-10 rounded-xl border p-8 text-muted-foreground">
          Ehhez a szavazáshoz még nincsenek képek.
        </div>
      ) : (
        <RankingBoard
          images={imagesWithUrls}
          challengeId={Number(id)}
          active={challenge.active}
        />
      )}
      </div>
    </main>
  );
}
