-- Create audit_logs table for security and compliance tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION get_audit_stats(user_id_param UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_events', COUNT(*),
    'successful_events', COUNT(*) FILTER (WHERE success = TRUE),
    'failed_events', COUNT(*) FILTER (WHERE success = FALSE),
    'recent_events', COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days'),
    'actions_by_type', (
      SELECT json_object_agg(action, action_count)
      FROM (
        SELECT action, COUNT(*) as action_count
        FROM audit_logs
        WHERE user_id = user_id_param
        GROUP BY action
        ORDER BY action_count DESC
        LIMIT 10
      ) actions
    )
  )
  FROM audit_logs
  WHERE user_id = user_id_param
$$ LANGUAGE SQL STABLE;

-- Function to clean up old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity(user_id_param UUID)
RETURNS TABLE (
  alert_type TEXT,
  alert_message TEXT,
  event_count BIGINT,
  last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
  -- Multiple failed login attempts
  RETURN QUERY
  SELECT 
    'FAILED_LOGINS'::TEXT,
    'Multiple failed login attempts detected'::TEXT,
    COUNT(*) as event_count,
    MAX(timestamp) as last_occurrence
  FROM audit_logs
  WHERE user_id = user_id_param
    AND action = 'LOGIN'
    AND success = FALSE
    AND timestamp > NOW() - INTERVAL '1 hour'
  HAVING COUNT(*) >= 5;

  -- Unusual number of deletions
  RETURN QUERY
  SELECT 
    'MASS_DELETION'::TEXT,
    'Unusual number of deletions detected'::TEXT,
    COUNT(*),
    MAX(timestamp)
  FROM audit_logs
  WHERE user_id = user_id_param
    AND action = 'DELETE'
    AND timestamp > NOW() - INTERVAL '1 hour'
  HAVING COUNT(*) >= 20;

  -- Multiple export requests (data exfiltration)
  RETURN QUERY
  SELECT 
    'MASS_EXPORT'::TEXT,
    'Multiple export requests detected'::TEXT,
    COUNT(*),
    MAX(timestamp)
  FROM audit_logs
  WHERE user_id = user_id_param
    AND action = 'EXPORT'
    AND timestamp > NOW() - INTERVAL '1 hour'
  HAVING COUNT(*) >= 5;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON TABLE audit_logs IS 'Security audit log for tracking all user actions';
COMMENT ON FUNCTION get_audit_stats IS 'Get audit log statistics for a user';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Clean up audit logs older than specified days';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Detect suspicious user activity patterns';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Audit logging system created successfully';
END $$;































