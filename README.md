This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase configuration

Copy `.env.example` to `.env.local` and fill in the values from your Supabase project under **Settings → API**:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Restart the Next.js dev server after changing `.env.local`. Never expose or commit the service role key.

For password recovery, add the callback URL used by your development server to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs. For example: `http://localhost:3001/auth/callback` (use the production domain in deployment).

Run `supabase/student_information.sql` in the Supabase SQL Editor before using the Student Information form. It creates a dedicated `student_information` table separate from `patient_status` and applies per-user RLS policies.

Run `supabase/dispensing_system.sql` after the student table migration to create or update the medicine inventory, dispensing transactions, daily limit, atomic dispense RPC, inventory adjustment RPC, dashboard statistics RPC, audit logs, and history policies used by the Admin Dashboard and Screen Display. The Screen Display expects the images at `public/img/img_1.jpg` through `public/img/img_4.jpg` and `public/img/img_5.png`.

To securely promote an existing Supabase Auth user, replace the placeholder UUID in `supabase/promote_admin.sql` and run it in the Supabase SQL Editor as a project administrator. Admin authorization uses Supabase `app_metadata`, which cannot be changed by a normal user. Public admin registration also requires the server-only `ADMIN_REGISTRATION_SECRET`; never expose that value to the browser.

Recommended SQL order:

1. `supabase/student_information.sql`
2. `supabase/dispensing_system.sql`
3. `supabase/promote_admin.sql` for the selected administrator only
4. `supabase/drop_patient_status.sql` only if the legacy table is intentionally being removed
