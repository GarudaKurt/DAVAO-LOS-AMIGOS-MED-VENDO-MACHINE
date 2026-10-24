import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScreenDisplayClient from "./ScreenDisplayClient";

export default async function AdminScreenDisplayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") redirect("/home");

  return <ScreenDisplayClient />;
}
