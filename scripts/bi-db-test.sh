#!/usr/bin/env bash
# Migration + seed + DB testleri + geri alma + yeniden uygulama, yerel Postgres üzerinde.
# Gereken: psql ve createdb/dropdb (PGHOST/PGUSER ile). Canlı Supabase'e DOKUNMAZ.
set -euo pipefail
cd "$(dirname "$0")/.."
DB=${BI_TEST_DB:-bi_test}
dropdb --if-exists "$DB"; createdb "$DB"
P="psql -v ON_ERROR_STOP=1 -q -d $DB"
$P -f supabase/tests/supabase-stub.sql
$P -f supabase/migrations/20261127190000_brand_intelligence.sql
$P -f supabase/seed/brands.sql
$P -f supabase/seed/brands.sql          # seed idempotent olmalı
test "$($P -Atc 'select count(*) from bi_entities')" = "39"
$P -f supabase/tests/bi_db.test.sql
$P -f supabase/rollback/20261127190000_brand_intelligence.down.sql
test "$($P -Atc "select count(*) from pg_tables where tablename like 'bi\_%'")" = "0"
$P -f supabase/migrations/20261127190000_brand_intelligence.sql   # geri alma sonrası yeniden uygulanabilir
dropdb "$DB"
echo "bi-db-test: OK"
