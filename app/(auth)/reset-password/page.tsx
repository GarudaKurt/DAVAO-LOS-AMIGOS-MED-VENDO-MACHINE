"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters.").max(72, "Password is too long."),
  confirmPassword: z.string().min(1, "Confirm your new password."),
}).refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export default function ResetPasswordPage() {
  const supabase = useRef(createClient()).current;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setReady(Boolean(data.session));
        if (!data.session) setError("This recovery link is invalid or has expired. Request a new link to continue.");
      }
    };
    checkRecoverySession();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check your password fields.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: result.data.password });
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setPassword("");
    setConfirmPassword("");
    setMessage("Your password has been updated. You can now sign in with your new password.");
  };

  return <main className="auth-page flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12"><div className="auth-card w-full max-w-lg rounded-3xl bg-white p-6 sm:p-10"><Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-strong)] hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to login</Link><div className="mt-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-wash)] text-[var(--color-primary-strong)]"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></div><h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Create a new password.</h1><p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Use a strong password that you do not reuse on another account.</p>{!ready && !message ? <Alert className="mt-8">{error || "Checking your recovery link..."}</Alert> : <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5"><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required className="rounded-xl border bg-neutral-50/80 px-4" /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your new password" autoComplete="new-password" required className="rounded-xl border bg-neutral-50/80 px-4" /></div>{error && <Alert>{error}</Alert>}{message && <p role="status" className="flex items-start gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm leading-6 text-green-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{message}</p>}<Button type="submit" disabled={loading} className="w-full">{loading ? "Updating password..." : "Update password"}</Button>{message && <Link href="/login" className="block text-center text-sm font-semibold text-[var(--color-primary-strong)] hover:underline">Continue to login</Link>}</form>}</div></main>;
}
