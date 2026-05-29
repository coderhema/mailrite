-- Outreach pipeline: find top prospects across LinkedIn & Gmail

SELECT
  c.name,
  c.email,
  c.role,
  c.company,
  c.source
FROM linkedin.connections c
WHERE c.email IS NOT NULL
  AND c.email != ''
ORDER BY c.name ASC
LIMIT {{limit}};
