-- Run this once if the medicine_inventory table was seeded with the old image paths.

update public.medicine_inventory
set image_path = case medicine_key
  when 'mefenamic-acid' then '/img/img_1.jpg'
  when 'betadine' then '/img/img_2.jpg'
  when 'paracetamol-biogesic' then '/img/img_3.jpg'
  when 'neozep' then '/img/img_4.jpg'
  when 'lanke-lande' then '/img/img_5.png'
  else image_path
end,
updated_at = timezone('utc', now())
where medicine_key in ('mefenamic-acid', 'betadine', 'paracetamol-biogesic', 'neozep', 'lanke-lande');
