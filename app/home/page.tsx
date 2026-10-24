"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HomeHeader from "@/components/home-header/HomeHeader";
import BottomNav from "@/components/bottom-nav/BottomNav";
import StudentInformationSheet, { StudentInformationValues } from "@/components/student-information/StudentInformationSheet";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadStudent = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.replace("/login"); return; }
      if (user.app_metadata?.role === "admin") { router.replace("/admin"); return; }
      const { data, error: studentError } = await supabase.from("student_information").select("full_name, grade, section").eq("user_id", user.id).maybeSingle();
      if (studentError) console.warn("Student profile row is not available yet:", studentError.message);
      setName(data?.full_name ?? "");
      setGrade(data?.grade != null ? String(data.grade) : "");
      setSection(data?.section ?? "");
      setLoading(false);
    };
    loadStudent();
  }, [router, supabase]);

  const studentInfo: StudentInformationValues = { fullName: name, grade, section };
  const hasStudentInfo = Boolean(name.trim() && grade && section);
  const handleStudentSaved = async (student: { fullName: string; grade: string; section: string }) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Your session expired. Please log in again.");
    const { error: profileError } = await supabase.from("student_information").upsert({ user_id: user.id, full_name: student.fullName, grade: Number(student.grade), section: student.section }, { onConflict: "user_id" });
    if (profileError) throw profileError;
    setName(student.fullName);
    setGrade(student.grade);
    setSection(student.section);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setError("");
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      setLoggingOut(false);
      setError("We could not log you out. Please try again.");
      return;
    }
    router.replace("/login");
    router.refresh();
  };

  return <div className="flex min-h-screen flex-col bg-[#fbf9fa]"><HomeHeader name={name || "Student"} onLogout={handleLogout} loggingOut={loggingOut} /><main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-8 pt-8 sm:px-8"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">Student home</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">Welcome to Vendo Medicine Machine.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">Keep your student information up to date so the Los Amigos SHS dispensing service can identify you correctly.</p></div>{loading ? <div className="rounded-3xl border bg-white p-8 text-center text-sm text-[var(--color-muted)]">Loading your information...</div> : error ? <div className="rounded-3xl border bg-white p-6 text-sm text-red-700">{error}</div> : hasStudentInfo ? <section className="rounded-3xl border bg-white p-5 shadow-[0_12px_40px_rgba(62,31,46,0.06)] sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">Student information</p><h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">Your details are saved.</h2></div><StudentInformationSheet initialValues={studentInfo} title="Edit Student Info" triggerLabel="Edit Student Info" onStudentAdded={handleStudentSaved} /></div><dl className="mt-7 grid gap-4 border-t pt-5 sm:grid-cols-3"><div><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Student Name</dt><dd className="mt-1 font-semibold text-[var(--color-ink)]">{name}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Grade</dt><dd className="mt-1 font-semibold text-[var(--color-ink)]">Grade {grade}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Section</dt><dd className="mt-1 font-semibold text-[var(--color-ink)]">Section {section}</dd></div></dl></section> : <section className="rounded-3xl border bg-white p-6 shadow-[0_12px_40px_rgba(62,31,46,0.06)] sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">Get started</p><h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">Create your student information.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[var(--color-muted)]">Add your Student Name, Grade, and Section so the medicine dispensing system can recognize your account.</p><div className="mt-6"><StudentInformationSheet initialValues={studentInfo} title="Create Student Info" triggerLabel="Create Student Info" onStudentAdded={handleStudentSaved} /></div></section>}</main><BottomNav /></div>;
}
