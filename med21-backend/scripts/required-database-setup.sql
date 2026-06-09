-- Run this only when the target PostgreSQL server does not already have the app database.
-- The current local server returned: database "medziva" does not exist.

CREATE DATABASE medziva;

-- After connecting to the new database, run the application schema:
-- psql "postgresql://postgres:Bala%402325@localhost:5432/medziva" \
--   -f src/db/migrations/0000_initial_schema.sql

-- If the boss database uses a non-public schema, create it and set DB_SCHEMA in .env:
-- CREATE SCHEMA IF NOT EXISTS your_schema_name;
