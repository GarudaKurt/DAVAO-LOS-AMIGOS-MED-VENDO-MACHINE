"use client";

import { useState } from "react";
import { GraduationCap, Users } from "lucide-react";
import BottomNav from "@/components/bottom-nav/BottomNav";
import StudentInformationSheet, { StudentRecord } from "@/components/student-information/StudentInformationSheet";

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf9fa]">
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-8 pt-8 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">Los Amigos SHS</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)]">Students</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">Manage student information for the Vendo Medicine Machine.</p>
          </div>
          <StudentInformationSheet onStudentAdded={(student) => setStudents((current) => [...current, student])} />
        </div>

        <section className="mt-8 rounded-3xl border bg-white p-5 shadow-[0_12px_40px_rgba(62,31,46,0.06)] sm:p-6" aria-labelledby="student-list-title">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <div><h2 id="student-list-title" className="font-semibold text-[var(--color-ink)]">Student list</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{students.length} {students.length === 1 ? "student" : "students"}</p></div>
            <Users className="h-5 w-5 text-[var(--color-primary-strong)]" aria-hidden="true" />
          </div>
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><GraduationCap className="h-8 w-8 text-[var(--color-primary-soft)]" aria-hidden="true" /><p className="mt-4 text-sm font-semibold text-[var(--color-ink)]">No students yet</p><p className="mt-1 max-w-xs text-sm leading-6 text-[var(--color-muted)]">Add a student to start building your school directory.</p></div>
          ) : (
            <ul className="divide-y" aria-label="Students">
              {students.map((student) => <li key={student.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold text-[var(--color-ink)]">{student.fullName}</p><p className="mt-1 text-sm text-[var(--color-muted)]">Grade {student.grade} · Section {student.section}</p></div><span className="rounded-full bg-[var(--color-primary-wash)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-strong)]">Active</span></li>)}
            </ul>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
