"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Boxes, GraduationCap, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Stats = { registered_students: number; available_medicines: number; dispensing_transactions: number; low_stock_items: number };

export default function AdminStats() {
  const supabase = useRef(createClient()).current;
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const { data } = await supabase.rpc("get_admin_dashboard_stats");
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setStats({ registered_students: Number(row.registered_students), available_medicines: Number(row.available_medicines), dispensing_transactions: Number(row.dispensing_transactions), low_stock_items: Number(row.low_stock_items) });
    };
    loadStats();
  }, [supabase]);

  const cards = [
    { label: "Registered students", value: stats?.registered_students ?? "—", icon: GraduationCap },
    { label: "Available medicines", value: stats?.available_medicines ?? "—", icon: Boxes },
    { label: "Dispensing transactions", value: stats?.dispensing_transactions ?? "—", icon: Activity },
    { label: "Low-stock items", value: stats?.low_stock_items ?? "—", icon: TriangleAlert },
  ];

  return <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard statistics">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-[var(--color-muted)]">{label}</p><Icon className="h-5 w-5 text-[var(--color-primary-strong)]" aria-hidden="true" /></div><p className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-ink)]">{value}</p></div>)}</section>;
}
