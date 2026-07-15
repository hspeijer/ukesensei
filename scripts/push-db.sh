#!/usr/bin/env bash
# Push schema changes to linked Supabase project.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source scripts/_supabase.sh

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "No linked Supabase project. Run: yarn setup:cloud"
  exit 1
fi

echo "Applying supabase/schema.sql..."
supabase_cmd db query --linked -f supabase/schema.sql
echo "Applying supabase/admin.sql..."
supabase_cmd db query --linked -f supabase/admin.sql

# Applying SQL this way (rather than through the Supabase dashboard SQL
# editor) doesn't trigger PostgREST's automatic schema-cache reload. Without
# this, PostgREST can keep serving stale function/table signatures after a
# migration, which surfaces to clients as "structure of query does not match
# function result type" on RPC calls until the cache is refreshed some other
# way (e.g. a project restart).
echo "Reloading PostgREST schema cache..."
supabase_cmd db query --linked "notify pgrst, 'reload schema';"

echo "Database schema applied."
