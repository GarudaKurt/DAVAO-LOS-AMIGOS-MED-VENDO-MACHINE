"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

const studentSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").regex(/^[A-Za-zÀ-ÿ' .-]+$/, "Use letters, spaces, apostrophes, or hyphens only."),
  grade: z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], { error: "Choose your grade level." }),
  section: z.string().trim().min(1, "Choose your section."),
});

const gradeOptions = Array.from({ length: 12 }, (_, index) => { const grade = String(index + 1); return { value: grade, label: `Grade ${grade}` }; });

export interface StudentInformationValues { fullName: string; grade: string; section: string; }

interface StudentInformationFormProps { initialValues?: StudentInformationValues; }

export default function StudentInformationForm({ initialValues }: StudentInformationFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(initialValues?.fullName ?? "");
  const [grade, setGrade] = useState(initialValues?.grade ?? "");
  const [section, setSection] = useState(initialValues?.section ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = studentSchema.safeParse({ fullName, grade, section });
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => { const key = String(issue.path[0]); if (!nextErrors[key]) nextErrors[key] = issue.message; });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setSaving(false);
      toast({ title: "Session expired", description: "Please log in again to save your information.", variant: "error" });
      return;
    }

    const { error } = await supabase.from("student_information").upsert({ user_id: user.id, full_name: result.data.fullName, grade: Number(result.data.grade), section: result.data.section }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setErrors({ form: "We could not save your information. Please try again." });
      toast({ title: "Could not save", description: error.message, variant: "error" });
      return;
    }

    toast({ title: "Information saved", description: "Your student details are ready for medicine dispensing." });
  };

  return (
    <section className="rounded-3xl border bg-white p-5 shadow-[0_12px_40px_rgba(62,31,46,0.06)] sm:p-7" aria-labelledby="student-information-title">
      <div className="flex items-start gap-4 border-b pb-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-wash)] text-[var(--color-primary-strong)]"><GraduationCap className="h-5 w-5" aria-hidden="true" /></div><div><h2 id="student-information-title" className="text-lg font-bold text-[var(--color-ink)]">Student information</h2><p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">Complete your details before using the medicine dispensing service.</p></div></div>
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {errors.form && <Alert>{errors.form}</Alert>}
        <div className="space-y-2"><Label htmlFor="home-full-name">Full Name <span className="text-[var(--color-primary-strong)]">*</span></Label><div className="rounded-xl border bg-neutral-50/80 px-3"><Input id="home-full-name" value={fullName} onChange={(event) => { setFullName(event.target.value); setErrors((current) => ({ ...current, fullName: "" })); }} placeholder="e.g. Maria Santos" autoComplete="name" aria-invalid={Boolean(errors.fullName)} /></div>{errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}</div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="home-grade">Grade <span className="text-[var(--color-primary-strong)]">*</span></Label><div className="rounded-xl border bg-neutral-50/80 px-3"><Select id="home-grade" name="grade" value={grade} onValueChange={(value) => { setGrade(value); setErrors((current) => ({ ...current, grade: "" })); }} options={gradeOptions} placeholder="Select grade" required aria-label="Grade level" /></div>{errors.grade && <p className="text-sm text-red-600">{errors.grade}</p>}</div><div className="space-y-2"><Label htmlFor="home-section">Section <span className="text-[var(--color-primary-strong)]">*</span></Label><div className="rounded-xl border bg-neutral-50/80 px-3"><Input id="home-section" name="section" value={section} onChange={(event) => { setSection(event.target.value); setErrors((current) => ({ ...current, section: "" })); }} placeholder="e.g. A or Rizal" aria-invalid={Boolean(errors.section)} /></div>{errors.section && <p className="text-sm text-red-600">{errors.section}</p>}</div></div>
        <Button type="submit" disabled={saving} className="w-full py-3.5 sm:w-auto sm:min-w-40">{saving ? "Saving..." : "Save information"}</Button>
      </form>
    </section>
  );
}
