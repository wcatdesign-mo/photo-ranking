"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });

      if (error) throw error;

      setSuccess(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Hiba történt a jelszó-visszaállítás során."
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
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-purple-300">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          PHOTO RANKING
        </div>

        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          Jelszó visszaállítása
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Segítünk visszaszerezni a hozzáférésedet.
        </p>
      </div>

      {success ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-3xl">
            ✉️
          </div>

          <h2 className="mt-6 text-2xl font-bold">
            Ellenőrizd az e-mailedet!
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Ha a megadott e-mail címmel regisztráltál, elküldtük a
            jelszó-visszaállításhoz szükséges linket.
          </p>

          <div className="mt-5 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-4 text-left">
            <p className="text-sm font-medium text-purple-200">
              📬 Nézd meg a levelezésedet
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              A linkre kattintva beállíthatod az új jelszavadat.
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
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-purple-950/20 backdrop-blur-xl sm:p-8">
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-5">
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

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading
                  ? "E-mail küldése..."
                  : "Jelszó-visszaállító link küldése →"}
              </button>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-muted-foreground">
              Emlékszel a jelszavadra?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-purple-300 transition hover:text-purple-200 hover:underline"
              >
                Bejelentkezés
              </Link>
            </div>
          </form>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground/60">
        Photo Ranking · Zsűri platform
      </p>
    </div>
  );
}
