"use client";

import Link from "next/link";
import { Mail, Lock, ShieldCheck, GraduationCap, KeyRound } from "lucide-react";
import AuthField from "@/components/authfield/Authentication";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const registerSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  role: z.enum(["student", "admin"], {
    error: "Choose whether this account is for a student or an admin",
  }),
  adminSecret: z.string().optional(),
});

export default function SignUpPage() {

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<"student" | "admin">("student");
  const [adminSecret, setAdminSecret] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // 1. Validate on the client first, before making any network request
    const result = registerSchema.safeParse({ email, password, role, adminSecret });

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    // 2. Send only the validated, trimmed data
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push("/login?registered=true");
  };

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="auth-card grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white md:grid-cols-[0.85fr_1.15fr]">
        <div className="hidden bg-[var(--color-primary-wash)] p-10 md:flex md:flex-col md:justify-between">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-bold text-white">FD</span>
              <span className="max-w-[170px] text-sm font-bold leading-tight tracking-wide text-[var(--color-ink)]">Vendo Medicine Machine</span>
            </div>
            <p className="max-w-xs text-3xl font-semibold leading-tight text-[var(--color-ink)]">Medicine access for our school community.</p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--color-muted)]">Create an account to use the student-developed Vendo Medicine Machine for Los Amigos SHS.</p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">Built by students · Los Amigos SHS</p>
        </div>
        <div className="p-6 sm:p-10 md:p-12">
          <div className="mb-8 md:hidden">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-bold text-white">FD</span>
              <span className="max-w-[170px] text-sm font-bold leading-tight tracking-wide text-[var(--color-ink)]">Vendo Medicine Machine</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">Create your account.</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Set up your secure account in a few seconds.</p>

        <form onSubmit={handleSubmit} className="mt-8" noValidate>

          <AuthField
            label="Email"
            icon={Mail}
            type="email"
            name="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
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
            onChange={(e)=>setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="new-password"
            required
          />
          <div className="mb-5">
            <Label htmlFor="role" className="mb-2 block">Account role</Label>
            <div className="auth-field flex items-center gap-3 rounded-xl border bg-neutral-50/80 px-4 py-3.5">
              {role === "admin" ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--color-primary-strong)]" aria-hidden="true" />
              ) : (
                <GraduationCap className="h-4 w-4 shrink-0 text-[var(--color-primary-strong)]" aria-hidden="true" />
              )}
              <Select id="role" name="role" value={role} onValueChange={(value) => setRole(value as "student" | "admin")} options={[{ value: "student", label: "Student" }, { value: "admin", label: "Admin" }]} required aria-label="Account role" />
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">Choose the role that matches how you will use the app.</p>
          </div>
          {role === "admin" && <div className="mb-5"><Label htmlFor="admin-secret" className="mb-2 block">Administrator registration secret</Label><div className="auth-field flex items-center gap-3 rounded-xl border bg-neutral-50/80 px-4 py-3.5"><KeyRound className="h-4 w-4 shrink-0 text-[var(--color-primary-strong)]" aria-hidden="true" /><Input id="admin-secret" type="password" value={adminSecret} onChange={(event) => setAdminSecret(event.target.value)} placeholder="Enter the private admin secret" autoComplete="off" className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></div><p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">Only authorized school system administrators should use this option.</p></div>}
          {error && (
            <Alert className="mb-4">{error}</Alert>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-4 active:scale-[0.99]"
          >
          {loading ? "Creating account..." : <>Sign Up</>}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already a member?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-primary-strong)] underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
        </div>
      </div>
    </main>
  );
}
