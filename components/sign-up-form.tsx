"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    if (!username.trim()) {
      setError("Kérjük, adj meg egy felhasználónevet.");
      setIsLoading(false);
      return;
    }

    if (!avatar) {
      setError("Kérjük, válassz egy avatart.");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("A két jelszó nem egyezik.");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: username.trim(),
            avatar,
          },
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });

      if (error) throw error;

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Hiba történt a regisztráció során."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("relative flex flex-col gap-6", className)}
      {...props}
    >
      {/* Háttér glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Branding */}
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-purple-300">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          PHOTO RANKING
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          Fiók létrehozása
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Hozd létre a fiókodat a zsűrizéshez.
        </p>
      </div>

      {/* Regisztrációs kártya */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-purple-950/20 backdrop-blur-xl sm:p-8">
        <form onSubmit={handleSignUp}>
          <div className="flex flex-col gap-5">
            {/* Felhasználónév */}
            <div className="grid gap-2">
              <Label htmlFor="username">
                Felhasználónév
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="pl. Mónika"
                required
                minLength={2}
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 border-white/10 bg-black/20 transition focus:border-purple-500/50 focus:ring-purple-500/20"
              />
              <p className="text-xs text-muted-foreground">
                Ez a név jelenik majd meg a zsűrizés és az eredmények során.
              </p>
            </div>

            {/* Avatar választás */}
            <div className="grid gap-3">
              <div>
                <Label>
                  Avatar
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ez a karakter jelenik majd meg a zsűrizés és az eredmények során.
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAvatarOpen((current) => !current)}
                  className={[
                    "flex h-16 w-full items-center gap-3 rounded-xl border bg-black/20 px-3 text-left transition",
                    avatarOpen
                      ? "border-purple-500/60 ring-2 ring-purple-500/20"
                      : "border-white/10 hover:border-purple-500/40",
                  ].join(" ")}
                  aria-expanded={avatarOpen}
                  aria-haspopup="listbox"
                >
                  {avatar ? (
                    <>
                      <img
                        src={`/avatars/${avatar}.png`}
                        alt="Kiválasztott avatar"
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <span className="flex-1 text-sm font-medium">
                        Avatar kiválasztva
                      </span>
                    </>
                  ) : (
                    <span className="flex-1 text-sm text-muted-foreground">
                      Válassz egy karaktert...
                    </span>
                  )}

                  <span
                    className={[
                      "text-lg text-muted-foreground transition-transform",
                      avatarOpen ? "rotate-180" : "",
                    ].join(" ")}
                  >
                    ▾
                  </span>
                </button>

                {avatarOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <p className="text-sm font-medium">
                        Válaszd ki a karakteredet
                      </p>
                      <button
                        type="button"
                        onClick={() => setAvatarOpen(false)}
                        className="text-xs text-muted-foreground hover:text-white"
                      >
                        Bezárás
                      </button>
                    </div>

                    <div
                      className="grid grid-cols-4 gap-3 sm:grid-cols-6"
                      role="listbox"
                      aria-label="Avatarok"
                    >
                      {Array.from({ length: 25 }, (_, index) => {
                        const avatarId = `avatar-${String(index + 1).padStart(2, "0")}`;

                        return (
                          <button
                            key={avatarId}
                            type="button"
                            onClick={() => {
                              setAvatar(avatarId);
                              setAvatarOpen(false);
                            }}
                            className={[
                              "relative aspect-square overflow-hidden rounded-2xl border-2 bg-white/5 p-1 transition hover:scale-105",
                              avatar === avatarId
                                ? "border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/40"
                                : "border-white/10 hover:border-purple-400/50 hover:bg-white/10",
                            ].join(" ")}
                            aria-label={`Avatar ${index + 1}`}
                            aria-selected={avatar === avatarId}
                          >
                            <img
                              src={`/avatars/${avatarId}.png`}
                              alt={`Avatar ${index + 1}`}
                              className="h-full w-full object-cover"
                            />

                            {avatar === avatarId && (
                              <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {!avatar && (
                <p className="text-xs text-muted-foreground">
                  Kérjük, válassz egy karaktert.
                </p>
              )}
            </div>

            {/* E-mail */}
            <div className="grid gap-2">
              <Label htmlFor="email">
                E-mail
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="te@email.hu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-white/10 bg-black/20 transition focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>

            {/* Jelszó */}
            <div className="grid gap-2">
              <Label htmlFor="password">
                Jelszó
              </Label>

              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-white/10 bg-black/20 transition focus:border-purple-500/50 focus:ring-purple-500/20"
              />

              <p className="text-xs text-muted-foreground">
                A jelszavadat biztonságosan tároljuk.
              </p>
            </div>

            {/* Jelszó újra */}
            <div className="grid gap-2">
              <Label htmlFor="repeat-password">
                Jelszó megerősítése
              </Label>

              <Input
                id="repeat-password"
                type="password"
                required
                value={repeatPassword}
                onChange={(e) =>
                  setRepeatPassword(e.target.value)
                }
                className="h-11 border-white/10 bg-black/20 transition focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>

            {/* Hiba */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Regisztráció */}
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "Fiók létrehozása..."
                : "Regisztráció →"}
            </button>
          </div>

          {/* Login */}
          <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-muted-foreground">
            Már van fiókod?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-purple-300 transition hover:text-purple-200 hover:underline"
            >
              Bejelentkezés
            </Link>
          </div>
        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground/60">
        Photo Ranking · Zsűri platform
      </p>
    </div>
  );
}
