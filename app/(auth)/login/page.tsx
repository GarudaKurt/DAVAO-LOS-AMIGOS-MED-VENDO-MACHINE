"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import AuthField from "@/components/authfield/Authentication";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role = user?.app_metadata?.role;
    router.push(role === "admin" ? "/admin" : "/home");
    router.refresh();
  };

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="auth-card grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white md:grid-cols-[0.85fr_1.15fr]">
        <div className="hidden bg-[var(--color-primary-wash)] p-10 md:flex md:flex-col md:justify-between">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-bold text-white">
                VM
              </span>
              <span className="max-w-[170px] text-sm font-bold leading-tight tracking-wide text-[var(--color-ink)]">
                Vendo Medicine Machine
              </span>
            </div>
            <p className="max-w-xs text-3xl font-semibold leading-tight text-[var(--color-ink)]">
              Accessible medicine, made simpler.
            </p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--color-muted)]">
              A student-developed solution for the Los Amigos Senior High School
              community.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">
            Built by students · Los Amigos SHS
          </p>
        </div>
        <div className="p-6 sm:p-10 md:p-12">
          <div className="mb-8 md:hidden">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-bold text-white">
                VM
              </span>
              <span className="max-w-[170px] text-sm font-bold leading-tight tracking-wide text-[var(--color-ink)]">
                Vendo Medicine Machine
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            Welcome back.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Sign in to continue to your safety dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8" noValidate>
            <AuthField
              label="Email"
              icon={Mail}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              autoComplete="email"
              required
            />
            <AuthField
              label="Password"
              icon={Lock}
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
            {error && <Alert className="mb-4">{error}</Alert>}
            <div className="-mt-1 mb-6 text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-[var(--color-primary-strong)] underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 active:scale-[0.99]"
            >
              {loading ? "Signing in..." : <>Login</>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
            Are you new here?{" "}
            <Link
              href="/register"
              className="font-semibold text-[var(--color-primary-strong)] underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
