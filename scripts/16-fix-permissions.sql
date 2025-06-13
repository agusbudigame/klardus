-- Perbaikan permissions untuk fitur baru

-- Grant permissions untuk sequences
GRANT USAGE ON SEQUENCE receipt_number_seq TO authenticated;

-- Grant permissions untuk functions
GRANT EXECUTE ON FUNCTION generate_receipt_number() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_inventory_value(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_stats(UUID, TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_customers(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_price_trends(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_daily_summary() TO authenticated;

-- Grant permissions untuk views
GRANT SELECT ON customer_transaction_stats TO authenticated;
GRANT SELECT ON collector_transaction_stats TO authenticated;
GRANT SELECT ON collector_inventory_stats TO authenticated;
GRANT SELECT ON daily_transaction_summary TO authenticated;

-- Tambahkan RLS policies untuk materialized view jika diperlukan
ALTER TABLE daily_transaction_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view daily summary"
    ON daily_transaction_summary FOR SELECT
    TO authenticated
    USING (true);

-- Policy tambahan untuk inventory dengan transaction_id
CREATE POLICY "Users can view inventory linked to their transactions"
    ON inventory FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.id = inventory.transaction_id
            AND (t.customer_id = auth.uid() OR t.collector_id = auth.uid())
        )
    );
