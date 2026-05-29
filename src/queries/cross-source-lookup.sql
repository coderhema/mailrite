-- Cross-source contact lookup: find a person across all connected networks

SELECT
  li.name AS linkedin_name,
  li.email,
  li.role AS linkedin_role,
  li.company AS linkedin_company,
  gp.name AS google_name
FROM linkedin.connections li
FULL OUTER JOIN google_people.contacts gp
  ON LOWER(li.email) = LOWER(gp.email)
LIMIT 10;
