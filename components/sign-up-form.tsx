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
