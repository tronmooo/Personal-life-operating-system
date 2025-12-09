-- ============================================================================
-- Database Query Optimization
-- ============================================================================
-- This migration optimizes database performance through:
-- 1. Additional indexes for common query patterns
-- 2. Materialized views for expensive aggregations
-- 3. Database functions for bulk operations
-- 4. Query performance improvements
-- ============================================================================

-- ============================================================================
-- 1. ADDITIONAL INDEXES
-- ============================================================================

-- Composite indexes for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_domain_entries_user_domain_created 
  ON domain_entries(user_id, domain, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_domain_entries_metadata_gin 
  ON domain_entries USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_documents_user_type_expiry 
  ON documents(user_id, document_type, expiry_date);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
  ON notifications(user_id, is_read, created_at DESC);

-- Partial indexes for common filters
CREATE INDEX IF NOT EXISTS idx_domain_entries_recent 
  ON domain_entries(user_id, domain, created_at)
  WHERE created_at > (NOW() - INTERVAL '30 days');

CREATE INDEX IF NOT EXISTS idx_documents_expiring 
  ON documents(user_id, expiry_date)
  WHERE expiry_date IS NOT NULL 
    AND expiry_date > NOW()
    AND expiry_date < (NOW() + INTERVAL '30 days');

-- ============================================================================
-- 2. MATERIALIZED VIEWS
-- ============================================================================

-- Materialized view for domain statistics (fast dashboard loading)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_domain_stats AS
SELECT 
  user_id,
  domain,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as monthly_count,
  MAX(created_at) as last_activity,
  MIN(created_at) as first_activity
FROM domain_entries
GROUP BY user_id, domain;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_domain_stats_user_domain 
  ON mv_domain_stats(user_id, domain);

-- Materialized view for user activity summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_activity AS
SELECT 
  user_id,
  COUNT(DISTINCT domain) as active_domains,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as entries_this_week,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as entries_this_month,
  MAX(created_at) as last_activity
FROM domain_entries
GROUP BY user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_activity_user 
  ON mv_user_activity(user_id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_domain_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_activity;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-dashboard-stats', '*/5 * * * *', 'SELECT refresh_dashboard_stats()');

-- ============================================================================
-- 3. BULK OPERATION FUNCTIONS
-- ============================================================================

-- Bulk delete domain entries with cascade
CREATE OR REPLACE FUNCTION bulk_delete_domain_entries(
  user_id_param UUID,
  entry_ids TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM domain_entries
  WHERE user_id = user_id_param
    AND id = ANY(entry_ids);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk update metadata fields
CREATE OR REPLACE FUNCTION bulk_update_metadata(
  user_id_param UUID,
  domain_param TEXT,
  updates JSONB
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE domain_entries
  SET metadata = metadata || updates,
      updated_at = NOW()
  WHERE user_id = user_id_param
    AND domain = domain_param;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get domain entries with pagination and filtering
CREATE OR REPLACE FUNCTION get_domain_entries_paginated(
  user_id_param UUID,
  domain_param TEXT,
  page_size INTEGER DEFAULT 20,
  page_number INTEGER DEFAULT 1,
  search_term TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.title,
    de.description,
    de.metadata,
    de.created_at,
    de.updated_at,
    COUNT(*) OVER() as total_count
  FROM domain_entries de
  WHERE de.user_id = user_id_param
    AND de.domain = domain_param
    AND (
      search_term IS NULL 
      OR de.title ILIKE '%' || search_term || '%'
      OR de.description ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    CASE WHEN sort_by = 'title' AND sort_order = 'ASC' THEN de.title END ASC,
    CASE WHEN sort_by = 'title' AND sort_order = 'DESC' THEN de.title END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'ASC' THEN de.created_at END ASC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'DESC' THEN de.created_at END DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 4. QUERY PERFORMANCE IMPROVEMENTS
-- ============================================================================

-- Function for efficient full-text search
CREATE OR REPLACE FUNCTION search_all_entries(
  user_id_param UUID,
  search_query TEXT,
  limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
  id TEXT,
  domain TEXT,
  title TEXT,
  description TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.id,
    de.domain,
    de.title,
    de.description,
    ts_rank(
      to_tsvector('english', de.title || ' ' || COALESCE(de.description, '')),
      to_tsquery('english', search_query)
    ) as relevance
  FROM domain_entries de
  WHERE de.user_id = user_id_param
    AND (
      to_tsvector('english', de.title || ' ' || COALESCE(de.description, '')) @@ 
      to_tsquery('english', search_query)
    )
  ORDER BY relevance DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add full-text search index
CREATE INDEX IF NOT EXISTS idx_domain_entries_fts 
  ON domain_entries USING gin (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  );

-- ============================================================================
-- 5. ANALYTICS FUNCTIONS
-- ============================================================================

-- Get domain activity trends
CREATE OR REPLACE FUNCTION get_domain_activity_trends(
  user_id_param UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  domain TEXT,
  entry_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    domain,
    COUNT(*) as entry_count
  FROM domain_entries
  WHERE user_id = user_id_param
    AND created_at > NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(created_at), domain
  ORDER BY date DESC, domain;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get top domains by activity
CREATE OR REPLACE FUNCTION get_top_domains(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 5
)
RETURNS TABLE (
  domain TEXT,
  total_entries BIGINT,
  recent_entries BIGINT,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    de.domain,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE de.created_at > NOW() - INTERVAL '7 days') as recent_entries,
    MAX(de.created_at) as last_activity
  FROM domain_entries de
  WHERE de.user_id = user_id_param
  GROUP BY de.domain
  ORDER BY recent_entries DESC, total_entries DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 6. PERFORMANCE MONITORING
-- ============================================================================

-- Log slow queries (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View for monitoring slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- Queries slower than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ============================================================================
-- 7. CLEANUP AND MAINTENANCE
-- ============================================================================

-- Function to archive old entries
CREATE OR REPLACE FUNCTION archive_old_entries(
  months_old INTEGER DEFAULT 12
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- In a real implementation, you'd move to an archive table
  -- For now, just count what would be archived
  SELECT COUNT(*) INTO archived_count
  FROM domain_entries
  WHERE created_at < NOW() - (months_old || ' months')::INTERVAL;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Vacuum and analyze tables for optimal performance
-- Run this periodically via cron job
CREATE OR REPLACE FUNCTION optimize_tables()
RETURNS void AS $$
BEGIN
  VACUUM ANALYZE domain_entries;
  VACUUM ANALYZE documents;
  VACUUM ANALYZE notifications;
  VACUUM ANALYZE proactive_insights;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. QUERY PLAN CACHING
-- ============================================================================

-- Prepare frequently used queries for faster execution
PREPARE get_user_domains (UUID) AS
  SELECT DISTINCT domain 
  FROM domain_entries 
  WHERE user_id = $1;

PREPARE get_recent_entries (UUID, TEXT, INTEGER) AS
  SELECT * 
  FROM domain_entries 
  WHERE user_id = $1 
    AND domain = $2
    AND created_at > NOW() - INTERVAL '7 days'
  ORDER BY created_at DESC 
  LIMIT $3;

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON MATERIALIZED VIEW mv_domain_stats IS 'Cached domain statistics for faster dashboard loading';
COMMENT ON MATERIALIZED VIEW mv_user_activity IS 'Cached user activity summary';
COMMENT ON FUNCTION refresh_dashboard_stats() IS 'Refreshes materialized views for dashboard stats';
COMMENT ON FUNCTION bulk_delete_domain_entries IS 'Efficiently delete multiple domain entries';
COMMENT ON FUNCTION bulk_update_metadata IS 'Bulk update metadata across domain entries';
COMMENT ON FUNCTION get_domain_entries_paginated IS 'Get paginated domain entries with search and sort';
COMMENT ON FUNCTION search_all_entries IS 'Full-text search across all entries';
COMMENT ON FUNCTION get_domain_activity_trends IS 'Get activity trends over time';
COMMENT ON FUNCTION get_top_domains IS 'Get most active domains';

-- ============================================================================
-- FINAL INDEX RECOMMENDATIONS
-- ============================================================================

-- Run ANALYZE to update statistics
ANALYZE domain_entries;
ANALYZE documents;
ANALYZE notifications;
ANALYZE proactive_insights;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database optimization complete!';
  RAISE NOTICE 'Indexes created, materialized views set up, and functions defined.';
  RAISE NOTICE 'Run SELECT refresh_dashboard_stats() to populate materialized views.';
END $$;




































