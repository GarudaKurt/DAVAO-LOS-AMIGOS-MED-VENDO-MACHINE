"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const emailSchema = z.string().trim().min(1, "Email is required.").email("Enter a valid email address.");

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(result.data, { redirectTo });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("If an account exists for this email, a password recovery link has been sent. Check your inbox and spam folder.");
  };

  return <main className="auth-page flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12"><div className="auth-card w-full max-w-lg rounded-3xl bg-white p-6 sm:p-10"><Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-strong)] hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to login</Link><div className="mt-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-wash)] text-[var(--color-primary-strong)]"><Send className="h-5 w-5" aria-hidden="true" /></div><h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Forgot your password?</h1><p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Enter your account email and we’ll send you a secure link to create a new password.</p><form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5"><div className="space-y-2"><Label htmlFor="recovery-email">Email address</Label><div className="auth-field flex items-center gap-3 rounded-xl border bg-neutral-50/80 px-4"><Mail className="h-4 w-4 shrink-0 text-[var(--color-primary-strong)]" aria-hidden="true" /><Input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></div></div>{error && <Alert>{error}</Alert>}{message && <p role="status" className="rounded-xl bg-green-50 px-3 py-2.5 text-sm leading-6 text-green-700">{message}</p>}<Button type="submit" disabled={loading} className="w-full">{loading ? "Sending recovery link..." : "Send recovery link"}</Button></form></div></main>;
}
