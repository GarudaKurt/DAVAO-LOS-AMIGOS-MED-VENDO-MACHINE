-- WARNING: Destructive migration.
-- This permanently removes the existing patient_status table and all
-- dependent database objects. Run only if the table is no longer needed.

begin;

drop table if exists public.patient_status cascade;

commit;
