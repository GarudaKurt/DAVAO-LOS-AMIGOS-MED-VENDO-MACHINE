"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ImageOff, Loader2, Pill } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const studentSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, "Enter the student’s full name.")
    .regex(
      /^[A-Za-zÀ-ÿ' .-]+$/,
      "Use letters, spaces, apostrophes, or hyphens only.",
    ),
  grade: z.enum(
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    { error: "Select a grade." },
  ),
  section: z.string().trim().min(1, "Enter the student’s section."),
});

const medicines = [
  {
    key: "mefenamic-acid",
    name: "Mefenamic Acid",
    image: "/img/img_1.jpg",
    description: "Pain relief",
  },
  {
    key: "paracetamol-biogesic",
    name: "Paracetamol Biogesic",
    image: "/img/img_3.jpg",
    description: "Fever relief",
  },
  {
    key: "neozep",
    name: "Neozep",
    image: "/img/img_4.jpg",
    description: "Cold relief",
  },
  {
    key: "kremel-s",
    name: "Kremel-S",
    image: "/img/img_6.jpg",
    description: "Medicine supply",
  },
  {
    key: "loperamide",
    name: "Loperamide",
    image: "/img/img_5.png",
    description: "Digestive relief",
  },
];

const gradeOptions = Array.from({ length: 12 }, (_, index) => {
  const grade = String(index + 1);
  return { value: grade, label: `Grade ${grade}` };
});
type InventoryRow = {
  id: string;
  medicine_key: string;
  name: string;
  image_path: string;
  stock_quantity: number;
  is_active: boolean;
};

export default function ScreenDisplayClient() {
  const supabase = useRef(createClient()).current;
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [studentUserId, setStudentUserId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState(2);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmMedicine, setConfirmMedicine] = useState<
    (typeof medicines)[number] | null
  >(null);

  useEffect(() => {
    const loadInventory = async () => {
      const { data, error: inventoryError } = await supabase
        .from("medicine_inventory")
        .select("id, medicine_key, name, image_path, stock_quantity, is_active")
        .in(
          "medicine_key",
          medicines.map((medicine) => medicine.key),
        );
      if (inventoryError)
        setError(
          "Medicine inventory is not connected. Run the dispensing SQL migration first.",
        );
      setInventory((data ?? []) as InventoryRow[]);
      setLoadingInventory(false);
    };
    loadInventory();
  }, [supabase]);

  const inventoryByKey = useMemo(
    () => new Map(inventory.map((item) => [item.medicine_key, item])),
    [inventory],
  );

  const handleStudentSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const result = studentSchema.safeParse({ studentName, grade, section });
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      });
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    setProcessing(true);
    const { data: matches, error: studentError } = await supabase
      .from("student_information")
      .select("user_id, full_name, grade, section")
      .eq("full_name", result.data.studentName)
      .eq("grade", Number(result.data.grade))
      .eq("section", result.data.section)
      .limit(2);
    if (studentError) {
      setError(
        "Student records are not connected. Run the student information SQL migration first.",
      );
      setProcessing(false);
      return;
    }
    if (!matches || matches.length !== 1) {
      setError(
        matches?.length
          ? "More than one student matches. Use the student’s exact registered information."
          : "No matching student record was found.",
      );
      setProcessing(false);
      return;
    }

    const { data: statusRows, error: statusError } = await supabase.rpc(
      "get_student_dispensing_status",
      { p_student_user_id: matches[0].user_id },
    );
    if (statusError) {
      setError(
        "Dispensing limits are not connected. Run the dispensing SQL migration first.",
      );
      setProcessing(false);
      return;
    }
    const status = Array.isArray(statusRows) ? statusRows[0] : statusRows;
    setStudentUserId(matches[0].user_id);
    setRemaining(Number(status?.remaining_today ?? 0));
    setDailyLimit(Number(status?.daily_limit ?? 2));
    setMessage("Student verified. Medicine selection is now available.");
    setProcessing(false);
  };

  const handleDispense = async (medicine: (typeof medicines)[number]) => {
    const stock = inventoryByKey.get(medicine.key);
    if (
      !studentUserId ||
      remaining === 0 ||
      !stock ||
      stock.stock_quantity < 1 ||
      processing
    )
      return;
    setConfirmMedicine(medicine);
  };

  const confirmDispense = async () => {
    if (!confirmMedicine) return;
    const medicine = confirmMedicine;
    const stock = inventoryByKey.get(medicine.key);
    if (
      !studentUserId ||
      remaining === 0 ||
      !stock ||
      stock.stock_quantity < 1 ||
      processing
    )
      return;
    setConfirmMedicine(null);
    setProcessing(true);
    setMessage("");
    setError("");
    const { error: dispenseError } = await supabase.rpc("dispense_medicine", {
      p_student_user_id: studentUserId,
      p_medicine_id: stock.id,
    });
    if (dispenseError) {
      setError(dispenseError.message);
      setProcessing(false);
      return;
    }
    setInventory((current) =>
      current.map((item) =>
        item.id === stock.id
          ? { ...item, stock_quantity: item.stock_quantity - 1 }
          : item,
      ),
    );
    setRemaining((current) => Math.max((current ?? 1) - 1, 0));
    setMessage(`${medicine.name} was recorded successfully.`);
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#fbf9fa] px-5 py-8 sm:px-8">
      <main className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">
              Admin workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-ink)]">
              Screen Display
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
              Verify a student before selecting medicine to dispense.
            </p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm">
            <span className="text-[var(--color-muted)]">Daily allowance </span>
            <strong className="text-[var(--color-primary-strong)]">
              {remaining ?? "—"} / {dailyLimit}
            </strong>
          </div>
        </div>
        <section className="rounded-3xl border bg-white p-5 shadow-[0_12px_40px_rgba(62,31,46,0.06)] sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-wash)] text-[var(--color-primary-strong)]">
              <Pill className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-ink)]">
                Student information
              </h2>
              <p className="text-sm text-[var(--color-muted)]">
                All fields are required before medicine selection.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleStudentSubmit}
            noValidate
            className="grid gap-5 md:grid-cols-[1.4fr_0.7fr_0.9fr_auto] md:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="display-student-name">Student Name</Label>
              <div className="rounded-xl border bg-neutral-50/80 px-3">
                <Input
                  id="display-student-name"
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  placeholder="Enter full name"
                  aria-invalid={Boolean(fieldErrors.studentName)}
                />
              </div>
              {fieldErrors.studentName && (
                <p className="text-sm text-red-600">
                  {fieldErrors.studentName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-grade">Grade</Label>
              <div className="rounded-xl border bg-neutral-50/80 px-3">
                <Select
                  id="display-grade"
                  value={grade}
                  onValueChange={setGrade}
                  options={gradeOptions}
                  placeholder="Select grade"
                  aria-label="Grade"
                />
              </div>
              {fieldErrors.grade && (
                <p className="text-sm text-red-600">{fieldErrors.grade}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-section">Section</Label>
              <div className="rounded-xl border bg-neutral-50/80 px-3">
                <Input
                  id="display-section"
                  value={section}
                  onChange={(event) => setSection(event.target.value)}
                  placeholder="e.g. A"
                  aria-invalid={Boolean(fieldErrors.section)}
                />
              </div>
              {fieldErrors.section && (
                <p className="text-sm text-red-600">{fieldErrors.section}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={processing}
              className="h-11 whitespace-nowrap"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify student"
              )}
            </Button>
          </form>
          {message && (
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {message}
            </p>
          )}
          {error && <Alert className="mt-4">{error}</Alert>}
        </section>
        <div className="mt-8 mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              Select medicine
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {studentUserId
                ? "Choose one medicine to dispense."
                : "Submit student information to enable medicine selection."}
            </p>
          </div>
          {remaining === 0 && (
            <span className="text-sm font-semibold text-red-600">
              Daily limit reached
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {medicines.map((medicine) => {
            const item = inventoryByKey.get(medicine.key);
            const disabled =
              !studentUserId ||
              processing ||
              remaining === 0 ||
              !item ||
              !item.is_active ||
              item.stock_quantity < 1;
            return (
              <button
                key={medicine.key}
                type="button"
                disabled={disabled}
                onClick={() => handleDispense(medicine)}
                className="flex min-h-32 items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary-soft)] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-primary-wash)]">
                  <img
                    src={medicine.image}
                    alt=""
                    className="h-full w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.nextElementSibling?.classList.remove(
                        "hidden",
                      );
                    }}
                  />
                  <ImageOff
                    className="hidden h-6 w-6 text-[var(--color-primary-soft)]"
                    aria-hidden="true"
                  />
                </div>
                <span className="min-w-0">
                  <span className="block font-semibold text-[var(--color-ink)]">
                    {medicine.name}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--color-muted)]">
                    {medicine.description}
                  </span>
                  <span className="mt-3 block text-xs font-semibold text-[var(--color-primary-strong)]">
                    {!studentUserId
                      ? "Verify student first"
                      : !item
                        ? "Unavailable"
                        : item.stock_quantity < 1
                          ? "Out of stock"
                          : `${item.stock_quantity} available`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <AlertDialog
          open={Boolean(confirmMedicine)}
          onOpenChange={(open) => !open && setConfirmMedicine(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm dispensing</AlertDialogTitle>
              <AlertDialogDescription>
                Dispense {confirmMedicine?.name} to {studentName}? This will
                reduce the available stock and count toward the student’s daily
                allowance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processing}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDispense}
                disabled={processing}
              >
                {processing ? "Processing..." : "Confirm dispensing"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
