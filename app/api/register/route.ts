import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";

const registrationSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["student", "admin"]),
  adminSecret: z.string().optional(),
});

export async function POST(request: Request) {
  const result = registrationSchema.safeParse(await request.json());

  if (!result.success) {
    return NextResponse.json(
      { error: "Enter a valid email, password, and account role." },
      { status: 400 }
    );
  }

  const { email, password, role, adminSecret } = result.data;

  if (role === "admin" && (!process.env.ADMIN_REGISTRATION_SECRET || adminSecret !== process.env.ADMIN_REGISTRATION_SECRET)) {
    return NextResponse.json({ error: "A valid administrator registration secret is required." }, { status: 403 });
  }

  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  const supabaseAdmin = createClient(url, serviceRoleKey);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, 
    user_metadata: { role },
    app_metadata: { role },
  });

  if (error) {
    console.error("Supabase createUser error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}
