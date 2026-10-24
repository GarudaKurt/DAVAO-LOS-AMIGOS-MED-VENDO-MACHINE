import Link from "next/link";
import { ArrowLeft, Boxes } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InventoryClient from "./InventoryClient";

export default async function AdminInventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/home");

  return <main className="min-h-screen bg-[#fbf9fa] px-5 py-8 sm:px-8"><div className="mx-auto max-w-4xl"><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-strong)]"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to dashboard</Link><section className="mt-8 rounded-3xl border bg-white p-6 shadow-[0_12px_40px_rgba(62,31,46,0.06)] sm:p-8"><Boxes className="h-7 w-7 text-[var(--color-primary-strong)]" aria-hidden="true" /><h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--color-ink)]">Inventory</h1><p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Manage stock levels for the five medicines available in the Vendo Medicine Machine.</p><InventoryClient /></section></div></main>;
}
