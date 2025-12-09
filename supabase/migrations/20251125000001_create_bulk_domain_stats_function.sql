-- Create function to get all domain statistics in one query
-- This solves the N+1 query problem for the dashboard

CREATE OR REPLACE FUNCTION get_bulk_domain_stats(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_object_agg(
    domain,
    json_build_object(
      'count', total_count,
      'recent_count', recent_count,
      'this_week', this_week_count,
      'this_month', this_month_count,
      'last_updated', last_updated,
      'recent_items', recent_items
    )
  ) INTO result
  FROM (
    SELECT 
      domain,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_count,
      COUNT(*) FILTER (WHERE created_at > date_trunc('week', NOW())) as this_week_count,
      COUNT(*) FILTER (WHERE created_at > date_trunc('month', NOW())) as this_month_count,
      MAX(updated_at) as last_updated,
      (
        SELECT json_agg(
          json_build_object(
            'id', id,
            'title', title,
            'created_at', created_at,
            'metadata', metadata
          )
          ORDER BY created_at DESC
        )
        FROM (
          SELECT id, title, created_at, metadata
          FROM domain_entries de2
          WHERE de2.domain = de.domain 
            AND de2.user_id = user_id_param
          ORDER BY created_at DESC
          LIMIT 5
        ) recent
      ) as recent_items
    FROM domain_entries de
    WHERE user_id = user_id_param
    GROUP BY domain
  ) stats;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a faster summary-only version (no recent items)
CREATE OR REPLACE FUNCTION get_bulk_domain_summary(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_object_agg(
    domain,
    json_build_object(
      'count', total_count,
      'recent_count', recent_count,
      'this_week', this_week_count,
      'this_month', this_month_count
    )
  ) INTO result
  FROM (
    SELECT 
      domain,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_count,
      COUNT(*) FILTER (WHERE created_at > date_trunc('week', NOW())) as this_week_count,
      COUNT(*) FILTER (WHERE created_at > date_trunc('month', NOW())) as this_month_count
    FROM domain_entries
    WHERE user_id = user_id_param
    GROUP BY domain
  ) stats;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_bulk_domain_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bulk_domain_summary(UUID) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION get_bulk_domain_stats IS 'Returns statistics for all domains in a single query. Solves N+1 query problem on dashboard.';
COMMENT ON FUNCTION get_bulk_domain_summary IS 'Returns summary statistics only (faster). Use when recent items not needed.';




































