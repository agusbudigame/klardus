-- Script 19: Enhance Invoice Support
-- This script adds necessary database enhancements for invoice functionality

-- 1. Add receipt_number sequence if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'receipt_number_seq') THEN
        CREATE SEQUENCE receipt_number_seq START 1001;
    END IF;
END
$$;

-- 2. Add receipt_number column to transactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'receipt_number') THEN
        ALTER TABLE transactions ADD COLUMN receipt_number TEXT;
    END IF;
END
$$;

-- 3. Add invoice_generated column to transactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'invoice_generated') THEN
        ALTER TABLE transactions ADD COLUMN invoice_generated BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;

-- 4. Add invoice_date column to transactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'invoice_date') THEN
        ALTER TABLE transactions ADD COLUMN invoice_date TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- 5. Add payment_terms column to transactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_terms') THEN
        ALTER TABLE transactions ADD COLUMN payment_terms TEXT DEFAULT 'Pembayaran dilakukan saat pengambilan kardus';
    END IF;
END
$$;

-- 6. Create function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Format: KB-YYYYMMDD-XXXX (KB = Kardus Bekas, YYYYMMDD = date, XXXX = sequence)
    NEW.receipt_number := 'KB-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('receipt_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically generate receipt numbers for new transactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'auto_generate_receipt_number') THEN
        CREATE TRIGGER auto_generate_receipt_number
        BEFORE INSERT ON transactions
        FOR EACH ROW
        WHEN (NEW.receipt_number IS NULL)
        EXECUTE FUNCTION generate_receipt_number();
    END IF;
END
$$;

-- 8. Create view for invoice data
CREATE OR REPLACE VIEW invoice_data AS
SELECT 
    t.id,
    t.receipt_number,
    t.transaction_date,
    t.invoice_date,
    t.amount,
    t.status,
    t.payment_terms,
    t.invoice_generated,
    cs.type,
    cs.condition,
    cs.weight,
    cs.price_per_kg,
    cs.id as submission_id,
    cp.full_name as customer_name,
    cp.phone as customer_phone,
    cp.email as customer_email,
    cp.address as customer_address,
    clp.full_name as collector_name,
    clp.phone as collector_phone,
    clp.email as collector_email,
    clp.address as collector_address,
    sl.address as pickup_address,
    sl.latitude,
    sl.longitude
FROM 
    transactions t
JOIN 
    cardboard_submissions cs ON t.submission_id = cs.id
JOIN 
    profiles cp ON cs.customer_id = cp.id
JOIN 
    profiles clp ON cs.collector_id = clp.id
LEFT JOIN 
    submission_locations sl ON cs.id = sl.submission_id;

-- 9. Add RLS policies for invoice_data view
CREATE POLICY invoice_data_customer_policy ON invoice_data
    FOR SELECT
    TO authenticated
    USING (auth.uid() = customer_id);

CREATE POLICY invoice_data_collector_policy ON invoice_data
    FOR SELECT
    TO authenticated
    USING (auth.uid() = collector_id);

-- 10. Update existing transactions with receipt numbers if they don't have one
UPDATE transactions 
SET receipt_number = 'KB-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(id::TEXT, 4, '0')
WHERE receipt_number IS NULL;

-- 11. Create function to get invoice statistics
CREATE OR REPLACE FUNCTION get_invoice_statistics(user_id UUID)
RETURNS TABLE (
    total_invoices BIGINT,
    total_amount NUMERIC,
    pending_invoices BIGINT,
    completed_invoices BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(t.id) as total_invoices,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(t.id) FILTER (WHERE t.status = 'pending') as pending_invoices,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_invoices
    FROM
        transactions t
    JOIN
        cardboard_submissions cs ON t.submission_id = cs.id
    WHERE
        cs.customer_id = user_id OR cs.collector_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_invoice_statistics TO authenticated;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Invoice support enhancements completed successfully';
END
$$;
