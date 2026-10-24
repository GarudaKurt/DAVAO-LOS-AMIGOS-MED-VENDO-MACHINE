"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Medicine = {
  id: string;
  medicine_key: string;
  name: string;
  image_path: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
};

export default function InventoryClient() {
  const supabase = useRef(createClient()).current;
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const imagePaths: Record<string, string> = { "mefenamic-acid": "/img/img_1.jpg", betadine: "/img/img_2.jpg", "paracetamol-biogesic": "/img/img_3.jpg", neozep: "/img/img_4.jpg", "lanke-lande": "/img/img_5.png" };

  useEffect(() => {
    const loadInventory = async () => {
      const { data, error: inventoryError } = await supabase
        .from("medicine_inventory")
        .select("id, medicine_key, name, image_path, stock_quantity, low_stock_threshold, is_active")
        .order("name");
      if (inventoryError) setError("Inventory is not connected. Run the dispensing SQL migration first.");
      setMedicines((data ?? []) as Medicine[]);
      setLoading(false);
    };
    loadInventory();
  }, [supabase]);

  const adjustStock = async (medicine: Medicine, delta: number) => {
    setProcessingId(medicine.id);
    setError("");
    setMessage("");
    const { data, error: adjustmentError } = await supabase.rpc("adjust_inventory", {
      p_medicine_id: medicine.id,
      p_quantity_delta: delta,
      p_reason: reason.trim() || (delta > 0 ? "Stock replenishment" : "Stock correction"),
    });
    setProcessingId(null);
    if (adjustmentError) {
      setError(adjustmentError.message);
      return;
    }
    setMedicines((current) => current.map((item) => item.id === medicine.id ? { ...item, stock_quantity: Number((data as Medicine).stock_quantity) } : item));
    setReason("");
    setMessage(`${medicine.name} inventory updated.`);
  };

  return <div className="mt-8"><div className="mb-5 flex flex-col gap-3 rounded-2xl bg-[var(--color-primary-wash)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-[var(--color-ink)]">Stock adjustments</p><p className="mt-1 text-sm text-[var(--color-muted)]">Every adjustment is validated atomically and recorded in the admin audit log.</p></div><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Optional adjustment reason" className="rounded-xl bg-white sm:max-w-xs" /></div>{message && <p className="mb-4 text-sm font-medium text-green-700">{message}</p>}{error && <Alert className="mb-4">{error}</Alert>}{loading ? <div className="rounded-2xl border p-8 text-center text-sm text-[var(--color-muted)]">Loading inventory...</div> : medicines.length === 0 ? <div className="rounded-2xl border p-8 text-center text-sm text-[var(--color-muted)]">No medicine inventory records found.</div> : <div className="grid gap-4 sm:grid-cols-2">{medicines.map((medicine) => { const lowStock = medicine.is_active && medicine.stock_quantity <= medicine.low_stock_threshold; return <article key={medicine.id} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--color-primary-wash)]"><img src={imagePaths[medicine.medicine_key] ?? medicine.image_path} alt="" className="h-full w-full object-contain" /></div><div className="min-w-0 flex-1"><h2 className="font-semibold text-[var(--color-ink)]">{medicine.name}</h2><p className={`mt-1 text-sm font-medium ${lowStock ? "text-amber-700" : "text-[var(--color-muted)]"}`}>{medicine.stock_quantity} available{lowStock ? " · Low stock" : ""}</p></div></div><div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-[var(--color-muted)]">Threshold: {medicine.low_stock_threshold}</span><div className="flex w-full gap-2 sm:w-auto"><Button type="button" variant="outline" disabled={processingId === medicine.id} className="h-11 min-w-24 flex-1 gap-2 px-3 sm:flex-none" onClick={() => adjustStock(medicine, -1)} aria-label={`Decrease ${medicine.name} stock`}><Minus className="h-5 w-5" aria-hidden="true" /><span>Remove 1</span></Button><Button type="button" disabled={processingId === medicine.id} className="h-11 min-w-24 flex-1 gap-2 px-3 sm:flex-none" onClick={() => adjustStock(medicine, 1)} aria-label={`Increase ${medicine.name} stock`}>{processingId === medicine.id ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}<span>Add 1</span></Button></div></div></article>; })}</div>}</div>;
}
