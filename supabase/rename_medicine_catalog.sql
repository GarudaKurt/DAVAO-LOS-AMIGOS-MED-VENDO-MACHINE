-- Rename the existing medicine catalog without deleting rows referenced by dispensing history.
-- Run this after the original dispensing_system.sql migration.

update public.medicine_inventory
set name = 'Paracetamol Biogesic', image_path = '/img/img_3.jpg', updated_at = timezone('utc', now())
where medicine_key = 'paracetamol-biogesic';

update public.medicine_inventory
set image_path = '/img/img_4.jpg', updated_at = timezone('utc', now())
where medicine_key = 'neozep';

update public.medicine_inventory
set medicine_key = 'kremel-s', name = 'Kremel-S', image_path = '/img/img_6.jpg', updated_at = timezone('utc', now())
where medicine_key = 'betadine';

update public.medicine_inventory
set medicine_key = 'loperamide', name = 'Loperamide', image_path = '/img/img_5.png', updated_at = timezone('utc', now())
where medicine_key = 'lanke-lande';
