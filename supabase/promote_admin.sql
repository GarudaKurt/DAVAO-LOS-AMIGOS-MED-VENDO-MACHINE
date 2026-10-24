-- Securely promote an existing Supabase Auth user.
-- Run this only in the Supabase SQL Editor as a project administrator.
-- Replace the placeholder UUID with the target user's auth.users.id.
-- Do not expose service-role credentials in the browser.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
where id = '00000000-0000-0000-0000-000000000000'::uuid;

-- To remove admin access, run:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
-- where id = '00000000-0000-0000-0000-000000000000'::uuid;
