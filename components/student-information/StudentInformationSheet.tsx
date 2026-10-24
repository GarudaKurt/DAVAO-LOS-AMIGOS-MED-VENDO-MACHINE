"use client";

import { useEffect, useState } from "react";
import { GraduationCap, UserPlus } from "lucide-react";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";

export interface StudentRecord { id: string; fullName: string; grade: string; section: string; }

const studentSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the student’s full name.").regex(/^[A-Za-zÀ-ÿ' .-]+$/, "Use letters, spaces, apostrophes, or hyphens only."),
  grade: z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], { error: "Choose a grade level." }),
  section: z.string().trim().min(1, "Choose a section."),
});

const gradeOptions = Array.from({ length: 12 }, (_, index) => { const grade = String(index + 1); return { value: grade, label: `Grade ${grade}` }; });

export interface StudentInformationValues { fullName: string; grade: string; section: string; }

interface StudentInformationSheetProps {
  onStudentAdded: (student: StudentRecord) => void;
  initialValues?: StudentInformationValues;
  title?: string;
  triggerLabel?: string;
}

export default function StudentInformationSheet({ onStudentAdded, initialValues, title = "Add Student", triggerLabel = "Add Student" }: StudentInformationSheetProps) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(initialValues?.fullName ?? "");
  const [grade, setGrade] = useState(initialValues?.grade ?? "");
  const [section, setSection] = useState(initialValues?.section ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFullName(initialValues?.fullName ?? "");
    setGrade(initialValues?.grade ?? "");
    setSection(initialValues?.section ?? "");
  }, [initialValues?.fullName, initialValues?.grade, initialValues?.section]);

  const resetForm = () => {
    setFullName(initialValues?.fullName ?? "");
    setGrade(initialValues?.grade ?? "");
    setSection(initialValues?.section ?? "");
    setErrors({});
  };
  const handleGradeChange = (value: string) => { setGrade(value); setErrors((current) => ({ ...current, grade: "" })); };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = studentSchema.safeParse({ fullName, grade, section });
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => { const key = String(issue.path[0]); if (!nextErrors[key]) nextErrors[key] = issue.message; });
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    onStudentAdded({ id: crypto.randomUUID(), ...result.data });
    setSaving(false);
    setOpen(false);
    resetForm();
    toast({ title: "Student added", description: `${result.data.fullName} was added to the student list.` });
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2"><UserPlus className="h-4 w-4" aria-hidden="true" />{triggerLabel}</Button>
      <Sheet open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetForm(); }}>
        <SheetContent side="right">
          <SheetHeader>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-wash)] text-[var(--color-primary-strong)]"><GraduationCap className="h-5 w-5" aria-hidden="true" /></div>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>Add a student profile for the Los Amigos SHS medicine vending system.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {errors.form && <Alert>{errors.form}</Alert>}
              <div className="space-y-2">
                <Label htmlFor="student-full-name">Full Name <span className="text-[var(--color-primary-strong)]">*</span></Label>
                <div className="rounded-xl border bg-neutral-50/80 px-3"><Input id="student-full-name" value={fullName} onChange={(event) => { setFullName(event.target.value); setErrors((current) => ({ ...current, fullName: "" })); }} placeholder="e.g. Maria Santos" autoComplete="name" aria-invalid={Boolean(errors.fullName)} /></div>
                {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-grade">Grade <span className="text-[var(--color-primary-strong)]">*</span></Label>
                <div className="rounded-xl border bg-neutral-50/80 px-3"><Select id="student-grade" name="grade" value={grade} onValueChange={handleGradeChange} options={gradeOptions} placeholder="Select grade level" required aria-label="Grade level" /></div>
                {errors.grade && <p className="text-sm text-red-600">{errors.grade}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-section">Section <span className="text-[var(--color-primary-strong)]">*</span></Label>
                <div className="rounded-xl border bg-neutral-50/80 px-3"><Input id="student-section" name="section" value={section} onChange={(event) => { setSection(event.target.value); setErrors((current) => ({ ...current, section: "" })); }} placeholder="e.g. A, Rizal, or STEM 11-A" disabled={!grade} aria-invalid={Boolean(errors.section)} /></div>
                {errors.section && <p className="text-sm text-red-600">{errors.section}</p>}
              </div>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="flex-1">{saving ? "Saving..." : "Save Student"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
