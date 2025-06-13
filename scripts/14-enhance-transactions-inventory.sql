-- Peningkatan Database untuk Fitur Transaksi dan Inventory

-- 1. Tambahkan kolom baru pada tabel transactions untuk fitur yang diperlukan
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS pickup_location TEXT,
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS collector_notes TEXT,
ADD COLUMN IF NOT EXISTS photo_urls TEXT[], -- Array untuk menyimpan multiple foto
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS actual_value NUMERIC(10, 2);

-- 2. Tambahkan kolom baru pada tabel inventory untuk tracking yang lebih baik
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS estimated_selling_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS location_stored TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS quality_grade INTEGER CHECK (quality_grade BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- 3. Buat sequence untuk receipt number yang unik
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1000;

-- 4. Fungsi untuk generate receipt number otomatis
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
    receipt_num TEXT;
BEGIN
    SELECT nextval('receipt_number_seq') INTO next_val;
    receipt_num := 'KB-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_val::TEXT, 4, '0');
    RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger untuk auto-generate receipt number
CREATE OR REPLACE FUNCTION auto_generate_receipt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger jika sudah ada, lalu buat ulang
DROP TRIGGER IF EXISTS auto_receipt_trigger ON transactions;
CREATE TRIGGER auto_receipt_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_receipt();

-- 6. Tambahkan index untuk performa query yang lebih baik
CREATE INDEX IF NOT EXISTS idx_transactions_customer_date ON transactions(customer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_collector_date ON transactions(collector_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_receipt ON transactions(receipt_number);
CREATE INDEX IF NOT EXISTS idx_inventory_collector_status ON inventory(collector_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_type_condition ON inventory(type, condition);
CREATE INDEX IF NOT EXISTS idx_submissions_status_date ON cardboard_submissions(status, created_at DESC);

-- 7. View untuk analytics dashboard customer
CREATE OR REPLACE VIEW customer_transaction_stats AS
SELECT 
    customer_id,
    COUNT(*) as total_transactions,
    SUM(weight) as total_weight,
    SUM(total_amount) as total_earnings,
    AVG(price_per_kg) as avg_price_per_kg,
    MAX(created_at) as last_transaction,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_transactions,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_transactions
FROM transactions 
WHERE customer_id IS NOT NULL
GROUP BY customer_id;

-- 8. View untuk analytics dashboard collector
CREATE OR REPLACE VIEW collector_transaction_stats AS
SELECT 
    collector_id,
    COUNT(*) as total_transactions,
    SUM(weight) as total_weight_purchased,
    SUM(total_amount) as total_spent,
    AVG(price_per_kg) as avg_purchase_price,
    COUNT(DISTINCT customer_id) as unique_customers,
    MAX(created_at) as last_transaction,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_transactions
FROM transactions 
WHERE collector_id IS NOT NULL
GROUP BY collector_id;

-- 9. View untuk inventory analytics
CREATE OR REPLACE VIEW collector_inventory_stats AS
SELECT 
    collector_id,
    COUNT(*) as total_items,
    SUM(weight) as total_weight,
    SUM(purchase_price) as total_investment,
    SUM(estimated_selling_price) as estimated_value,
    COUNT(CASE WHEN status = 'in_stock' THEN 1 END) as items_in_stock,
    COUNT(CASE WHEN status = 'sold' THEN 1 END) as items_sold,
    AVG(quality_grade) as avg_quality_grade,
    MIN(acquired_date) as oldest_item_date
FROM inventory 
WHERE collector_id IS NOT NULL
GROUP BY collector_id;

-- 10. Fungsi untuk menghitung estimasi nilai inventory berdasarkan harga pasar terkini
CREATE OR REPLACE FUNCTION calculate_inventory_value(collector_uuid UUID)
RETURNS TABLE(
    total_items BIGINT,
    total_weight NUMERIC,
    estimated_value NUMERIC,
    by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(i.id)::BIGINT as total_items,
        COALESCE(SUM(i.weight), 0) as total_weight,
        COALESCE(SUM(i.weight * COALESCE(cp.price_per_kg, 0)), 0) as estimated_value,
        COALESCE(
            jsonb_object_agg(
                i.type || ' (' || i.condition || ')',
                jsonb_build_object(
                    'count', COUNT(i.id),
                    'weight', SUM(i.weight),
                    'value', SUM(i.weight * COALESCE(cp.price_per_kg, 0))
                )
            ),
            '{}'::jsonb
        ) as by_type
    FROM inventory i
    LEFT JOIN cardboard_prices cp ON (
        cp.type = i.type 
        AND cp.condition = i.condition 
        AND cp.collector_id = collector_uuid
        AND cp.is_active = true
    )
    WHERE i.collector_id = collector_uuid 
    AND i.status = 'in_stock';
END;
$$ LANGUAGE plpgsql;

-- 11. Fungsi untuk mendapatkan statistik transaksi per periode
CREATE OR REPLACE FUNCTION get_transaction_stats(
    user_uuid UUID,
    user_role TEXT,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    period_start DATE,
    period_end DATE,
    transaction_count BIGINT,
    total_weight NUMERIC,
    total_amount NUMERIC,
    avg_price_per_kg NUMERIC
) AS $$
BEGIN
    IF start_date IS NULL THEN
        start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF end_date IS NULL THEN
        end_date := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    SELECT 
        start_date as period_start,
        end_date as period_end,
        COUNT(*)::BIGINT as transaction_count,
        COALESCE(SUM(t.weight), 0) as total_weight,
        COALESCE(SUM(t.total_amount), 0) as total_amount,
        COALESCE(AVG(t.price_per_kg), 0) as avg_price_per_kg
    FROM transactions t
    WHERE 
        t.transaction_date BETWEEN start_date AND end_date
        AND (
            (user_role = 'customer' AND t.customer_id = user_uuid) OR
            (user_role = 'collector' AND t.collector_id = user_uuid)
        )
        AND t.payment_status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- 12. Update RLS policies untuk view yang baru
-- Policy untuk customer_transaction_stats
DROP POLICY IF EXISTS "Users can view their own transaction stats" ON customer_transaction_stats;
-- Note: Views inherit RLS from base tables, so we rely on existing transaction policies

-- 13. Fungsi untuk update inventory otomatis saat transaksi dibuat
CREATE OR REPLACE FUNCTION update_inventory_on_transaction_v2()
RETURNS TRIGGER AS $$
DECLARE
    submission_condition TEXT;
BEGIN
    -- Ambil kondisi dari submission jika ada
    IF NEW.submission_id IS NOT NULL THEN
        SELECT condition INTO submission_condition 
        FROM cardboard_submissions 
        WHERE id = NEW.submission_id;
    END IF;
    
    -- Update atau insert ke inventory
    INSERT INTO inventory (
        collector_id,
        type,
        condition,
        weight,
        acquired_date,
        source,
        notes,
        purchase_price,
        estimated_selling_price,
        transaction_id,
        status
    )
    VALUES (
        NEW.collector_id,
        NEW.type,
        COALESCE(submission_condition, 'good'), -- default condition
        NEW.weight,
        CURRENT_DATE,
        'purchase',
        'Dari transaksi #' || NEW.receipt_number,
        NEW.total_amount,
        NEW.total_amount * 1.2, -- estimasi 20% markup
        NEW.id,
        'in_stock'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger lama dan buat yang baru
DROP TRIGGER IF EXISTS on_transaction_update_inventory ON transactions;
CREATE TRIGGER on_transaction_update_inventory_v2
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_transaction_v2();

-- 14. Tambahkan constraint untuk data integrity
ALTER TABLE transactions 
ADD CONSTRAINT check_positive_weight CHECK (weight > 0),
ADD CONSTRAINT check_positive_price CHECK (price_per_kg > 0),
ADD CONSTRAINT check_positive_amount CHECK (total_amount > 0);

ALTER TABLE inventory
ADD CONSTRAINT check_inventory_positive_weight CHECK (weight > 0),
ADD CONSTRAINT check_quality_grade_range CHECK (quality_grade IS NULL OR (quality_grade >= 1 AND quality_grade <= 5));

-- 15. Buat materialized view untuk reporting yang lebih cepat
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_transaction_summary AS
SELECT 
    transaction_date,
    COUNT(*) as transaction_count,
    SUM(weight) as total_weight,
    SUM(total_amount) as total_amount,
    AVG(price_per_kg) as avg_price_per_kg,
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(DISTINCT collector_id) as active_collectors
FROM transactions 
WHERE payment_status = 'completed'
GROUP BY transaction_date
ORDER BY transaction_date DESC;

-- Index untuk materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_transaction_summary(transaction_date);

-- Function untuk refresh materialized view
CREATE OR REPLACE FUNCTION refresh_daily_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_transaction_summary;
END;
$$ LANGUAGE plpgsql;

-- 16. Tambahkan beberapa fungsi utility untuk aplikasi
CREATE OR REPLACE FUNCTION get_top_customers(collector_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    customer_id UUID,
    customer_name TEXT,
    total_transactions BIGINT,
    total_weight NUMERIC,
    total_amount NUMERIC,
    last_transaction TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.customer_id,
        p.name as customer_name,
        COUNT(*)::BIGINT as total_transactions,
        SUM(t.weight) as total_weight,
        SUM(t.total_amount) as total_amount,
        MAX(t.created_at) as last_transaction
    FROM transactions t
    JOIN profiles p ON p.id = t.customer_id
    WHERE t.collector_id = collector_uuid
    AND t.payment_status = 'completed'
    GROUP BY t.customer_id, p.name
    ORDER BY total_amount DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 17. Fungsi untuk mendapatkan trend harga
CREATE OR REPLACE FUNCTION get_price_trends(
    cardboard_type TEXT DEFAULT NULL,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    date_recorded DATE,
    type TEXT,
    condition TEXT,
    avg_price NUMERIC,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.transaction_date as date_recorded,
        t.type,
        COALESCE(s.condition, 'unknown') as condition,
        AVG(t.price_per_kg) as avg_price,
        COUNT(*)::BIGINT as transaction_count
    FROM transactions t
    LEFT JOIN cardboard_submissions s ON s.id = t.submission_id
    WHERE 
        t.transaction_date >= CURRENT_DATE - INTERVAL '1 day' * days_back
        AND t.payment_status = 'completed'
        AND (cardboard_type IS NULL OR t.type = cardboard_type)
    GROUP BY t.transaction_date, t.type, s.condition
    ORDER BY t.transaction_date DESC, t.type, s.condition;
END;
$$ LANGUAGE plpgsql;

-- 18. Buat scheduled job untuk refresh materialized view (jika diperlukan)
-- Note: Ini memerlukan pg_cron extension yang mungkin tidak tersedia di Supabase
-- Alternatifnya adalah refresh manual atau via aplikasi

COMMENT ON TABLE transactions IS 'Tabel transaksi jual beli kardus bekas dengan fitur lengkap';
COMMENT ON TABLE inventory IS 'Tabel inventory kardus bekas milik pengepul dengan tracking detail';
COMMENT ON VIEW customer_transaction_stats IS 'View statistik transaksi untuk customer';
COMMENT ON VIEW collector_transaction_stats IS 'View statistik transaksi untuk collector';
COMMENT ON VIEW collector_inventory_stats IS 'View statistik inventory untuk collector';
COMMENT ON FUNCTION generate_receipt_number() IS 'Generate nomor receipt otomatis dengan format KB-YYYYMMDD-XXXX';
COMMENT ON FUNCTION calculate_inventory_value(UUID) IS 'Hitung nilai inventory berdasarkan harga pasar terkini';
