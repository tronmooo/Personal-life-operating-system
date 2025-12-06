-- Extend domain_entries_view to include health metrics
create or replace view domain_entries_view as
select
  id,
  user_id,
  domain,
  title,
  description,
  metadata,
  created_at,
  updated_at
from domain_entries

union all

select
  hm.id,
  hm.user_id,
  'health'::text as domain,
  coalesce(hm.metadata->>'title', hm.metric_type) as title,
  hm.metadata->>'description' as description,
  jsonb_build_object(
    'category', 'metric',
    'metricType', hm.metric_type,
    'recordedAt', hm.recorded_at,
    'value', hm.value,
    'secondaryValue', hm.secondary_value,
    'unit', hm.unit
  ) || coalesce(hm.metadata, '{}'::jsonb) as metadata,
  hm.created_at,
  hm.updated_at
from health_metrics hm;
