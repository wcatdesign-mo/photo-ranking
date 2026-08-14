import Link from "next/link";

export default function Page() {
  return (
    <main className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-6 py-10">
      {/* Háttér glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            PHOTO RANKING
          </div>
        </div>

        {/* Kártya */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-3xl">
            ✉️
          </div>

          <h1 className="mt-6 text-2xl font-bold">
            Sikeres regisztráció!
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A fiókod létrejött. Küldtünk egy megerősítő e-mailt a
            megadott e-mail címre.
          </p>

          <div className="mt-5 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-4 text-left">
            <p className="text-sm font-medium text-purple-200">
              📬 Nézd meg a levelezésedet
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              A fiókod aktiválásához kattints az e-mailben található
              megerősítő linkre.
            </p>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Ha nem találod az üzenetet, ellenőrizd a spam vagy
            promóciók mappát is.
          </p>

          <Link
            href="/auth/login"
            className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-blue-500"
          >
            Vissza a bejelentkezéshez →
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Photo Ranking · Zsűri platform
        </p>
      </div>
    </main>
  );
}
