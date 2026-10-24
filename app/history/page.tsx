"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardList } from "lucide-react";
import BottomNav from "@/components/bottom-nav/BottomNav";
import { createClient } from "@/lib/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";

type DispensingRecord = {
  id: string;
  student_name: string;
  grade: number;
  section: string;
  dispensed_at: string;
  medicine_inventory: { name: string } | null;
};

export default function HistoryPage() {
  const supabase = useRef(createClient()).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<DispensingRecord[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("Please log in again to view your history.");
        setLoading(false);
        return;
      }

      const { data, error: historyError } = await supabase
        .from("dispensing_transactions")
        .select("id, student_name, grade, section, dispensed_at, medicine_inventory(name)")
        .order("dispensed_at", { ascending: false });

      if (historyError) setError("Dispensing history is not connected. Run the dispensing SQL migration first.");
      setRecords((data ?? []) as unknown as DispensingRecord[]);
      setLoading(false);
    };
    checkSession();
  }, [supabase]);

  return <div className="flex min-h-screen flex-col bg-[#fbf9fa]"><main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-8 pt-8 sm:px-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">Medicine dispensing</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)]">History</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">Review your medicine dispensing records in one place.</p><section className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-[0_12px_40px_rgba(62,31,46,0.06)]"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Student Name</TableHead><TableHead>Grade</TableHead><TableHead>Section</TableHead><TableHead>Medicine Type</TableHead><TableHead>Date of Dispense</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={5} className="h-40 text-center text-[var(--color-muted)]">Loading dispensing history...</TableCell></TableRow> : error ? <TableRow><TableCell colSpan={5}><Alert>{error}</Alert></TableCell></TableRow> : records.length === 0 ? <TableRow><TableCell colSpan={5} className="h-48 text-center"><ClipboardList className="mx-auto h-8 w-8 text-[var(--color-primary-soft)]" aria-hidden="true" /><p className="mt-3 font-semibold text-[var(--color-ink)]">No dispensing records yet</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[var(--color-muted)]">Your medicine dispensing records will appear here after a successful transaction.</p></TableCell></TableRow> : records.map((record) => <TableRow key={record.id}><TableCell className="font-medium">{record.student_name}</TableCell><TableCell>Grade {record.grade}</TableCell><TableCell>{record.section}</TableCell><TableCell>{record.medicine_inventory?.name ?? "Unknown medicine"}</TableCell><TableCell>{new Date(record.dispensed_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</TableCell></TableRow>)}</TableBody></Table></div></section></main><BottomNav /></div>;
}
