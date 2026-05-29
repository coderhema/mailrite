-- Find contacts matching a role/title across all connected sources

SELECT
  c.name,
  c.email,
  c.role,
  c.company,
  c.source
FROM (
  SELECT name, email, role, company, 'linkedin' AS source
  FROM linkedin.connections
  UNION ALL
  SELECT name, NULL AS email, NULL AS role, NULL AS company, 'google_people' AS source
  FROM google_people.contacts
) c
ORDER BY c.name ASC
LIMIT {{limit}};
