-- Migration: Set Indian Standard Time (IST) for all tables
-- Converts created_at and updated_at to TIMESTAMP WITHOUT TIME ZONE formatted in Asia/Kolkata

ALTER DATABASE postgres SET timezone TO 'Asia/Kolkata';

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'users', 'raw_materials', 'raw_material_lots', 'products', 'parties', 
        'vendors', 'vehicles', 'pulp_formulas', 'machine_rolls', 'reels', 
        'transaction_logs', 'boiler_logs', 'etp_logs', 'electricity_logs', 
        'pending_orders', 'packing_slips', 'paper_test_reports'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('
            ALTER TABLE public.%I 
            ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE 
            USING (created_at AT TIME ZONE ''Asia/Kolkata''),
            ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE ''Asia/Kolkata'');
        ', tbl);
    END LOOP;
END $$;

ALTER TABLE public.store_items 
  ALTER COLUMN updated_at TYPE TIMESTAMP WITHOUT TIME ZONE 
  USING (updated_at AT TIME ZONE 'Asia/Kolkata'),
  ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

ALTER TABLE public.store_items 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');
