-- Fix get_expiring_documents function to accept UUID and handle DATE arithmetic safely

DROP FUNCTION IF EXISTS get_expiring_documents(text, int);
DROP FUNCTION IF EXISTS get_expiring_documents(uuid, int);

CREATE OR REPLACE FUNCTION get_expiring_documents(
  p_user_id UUID,
  p_days_ahead INT DEFAULT 90
)
RETURNS TABLE (
  id UUID,
  document_name TEXT,
  domain TEXT,
  expiration_date DATE,
  days_until_expiration INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.document_name,
    d.domain,
    d.expiration_date,
    (d.expiration_date - CURRENT_DATE)::INT as days_until_expiration
  FROM documents d
  WHERE d.user_id = p_user_id
    AND d.expiration_date IS NOT NULL
    AND d.expiration_date > CURRENT_DATE
    AND d.expiration_date <= CURRENT_DATE + p_days_ahead
  ORDER BY d.expiration_date ASC;
END;
$$ LANGUAGE plpgsql;





















