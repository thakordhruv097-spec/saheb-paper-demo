-- Saheb Paper ERP: Security & Performance Migration
-- Adds high-performance indexes for core production tables and trigger for automated timestamp tracking

-- 1. Automated updated_at Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at Triggers
DO $$
DECLARE
    t text;
    tables_with_updated_at text[] := ARRAY[
        'users', 'raw_materials', 'products', 'parties', 'vendors', 'vehicles', 'store_items'
    ];
BEGIN
    FOREACH t IN ARRAY tables_with_updated_at LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_%I_updated_at ON public.%I;', t, t);
        EXECUTE format('CREATE TRIGGER tr_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();', t, t);
    END LOOP;
END $$;

-- 2. Performance Indexes on Operational ERP Tables
CREATE INDEX IF NOT EXISTS idx_reels_date_status ON public.reels(production_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_reels_parent_roll ON public.reels(parent_roll_no);
CREATE INDEX IF NOT EXISTS idx_reels_qc_grade ON public.reels(qc_grade);
CREATE INDEX IF NOT EXISTS idx_machine_rolls_date ON public.machine_rolls(date DESC, shift);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON public.pending_orders(status, due_date);
CREATE INDEX IF NOT EXISTS idx_packing_slips_date ON public.packing_slips(date DESC, party_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_time ON public.transaction_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paper_test_reports_roll ON public.paper_test_reports(roll_no, date DESC);
CREATE INDEX IF NOT EXISTS idx_boiler_logs_date ON public.boiler_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_etp_logs_date ON public.etp_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_electricity_logs_date ON public.electricity_logs(date DESC);

-- 3. Production Security & RLS Policies
-- Note: In production with authenticated users, replace public permissive policies with role-checked policies:
-- e.g. Viewer = SELECT only; Admin = ALL; Operators = module-scoped INSERT/UPDATE.
